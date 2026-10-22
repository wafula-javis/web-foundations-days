 SnapShare Scaling Plan
 
SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow. This plan estimates how much traffic and storage it must handle and sketches an architecture that can carry it.
 
## 1. Assumptions
 
**Given facts**
- 10 million registered users.
- 10% of them are active each day.
- Each active user uploads 1 photo per day and views 50 feed pages per day.
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail.
**My assumptions**
- Activity is spread evenly over 24 hours (86,400 seconds) to get an average. Peak traffic is 5 times the average.
- Units are decimal: 1 MB = 1,000 KB and 1 TB = 1,000,000 MB.
- Each feed page shows about 10 thumbnails (used only for the traffic estimate in section 3).
- Each photo record in the database (owner, file location, caption, timestamps) is about 1 KB.
- Storage figures count one copy of each file. Real storage services keep extra copies for safety, which would raise the raw disk used.
## 2. Daily active users
 
10,000,000 registered users x 10% = **1,000,000 daily active users (DAU)**.
 
## 3. Estimates
 
| Measure | Calculation | Result |
|---|---|---|
| Uploads per day | 1,000,000 users x 1 photo | 1,000,000 |
| Uploads per second (average) | 1,000,000 / 86,400 | about 11.6 |
| Uploads per second (peak) | 11.57 x 5 | about 58 |
| Feed views per day | 1,000,000 users x 50 pages | 50,000,000 |
| Feed views per second (average) | 50,000,000 / 86,400 | about 579 |
| Feed views per second (peak) | 578.7 x 5 | about 2,894 |
| Storage per photo | 2 MB original + 0.05 MB thumbnail | 2.05 MB |
| Storage per day | 1,000,000 x 2.05 MB | about 2.05 TB |
| Storage per year | 2.05 TB x 365 | **about 748 TB (roughly 0.75 PB)** |
 
The yearly total is made up of about 730 TB of original photos and about 18 TB of thumbnails.
 
**Extra estimate: image traffic leaving the system.** If each feed page shows 10 thumbnails of 50 KB, that is 50,000,000 pages x 10 x 50 KB = about **25 TB per day**, or roughly 2.3 Gbps on average and 11.6 Gbps at peak. If the app sent full 2 MB photos instead of thumbnails, it would be 1,000 TB per day, which is 40 times more. This is why thumbnails and a CDN are part of the design.
 
## 4. Read-heavy or write-heavy?
 
**SnapShare is read-heavy.** There are 50 million feed views for every 1 million uploads, so the system reads about **50 times** for every write. (It is even more lopsided if you count every photo loaded on each page.)
 
What this means for the design:
- Put effort into serving reads fast: a CDN for images, a cache for feeds, and a read replica for the database.
- Keep writes simple and quick. Slow work such as making thumbnails is moved off the upload path into a background queue.
- Scale the read side first, because that is where almost all of the load is.
## 5. Why photos should not be stored inside the database
 
- **Size.** Photos add about 748 TB per year. The database records for those photos add only about 365 GB per year (1 KB x 1,000,000 x 365), so the files are roughly 2,000 times bigger than the data the database is good at.
- **Speed.** Large files in the database make backups, copying to replicas, and queries slow, and they tie up database connections that should be answering feed queries.
- **Cost.** Database disks are expensive compared with storage built for files.
- **Delivery.** A database cannot hand files to a CDN or to users' browsers efficiently.
**Where photos go instead:** object storage, a service designed to hold huge numbers of files cheaply and safely. The database keeps only the photo's metadata and the key (location) of its file in object storage, and the CDN sits in front of object storage to serve the files.
 
## 6. Architecture diagram
 
```
                      Users (mobile app / web)
                       |                    |
          photo files  |                    |  API calls (feed, upload)
                       v                    v
                 +-----------+       +-----------------+
                 |    CDN    |       |  Load balancer  |
                 +-----+-----+       +--------+--------+
                       |                      |
                  cache miss                  v
                       |             +-----------------+
                       |             |   App servers   |
                       |             |  (several, all  |
                       |             |   identical)    |
                       |             +---+----+----+---+
                       |                 |    |    |
                       |      +----------+    |    +-----------+
                       |      |               |                |
                       |      v               v                v
                       |  +-------+   +--------------+   +-----------+
                       |  | Cache |   |  Primary DB  |   |   Queue   |
                       |  +-------+   |   (writes)   |   +-----+-----+
                       |              +------+-------+         |
                       |                     |                 | thumbnail job
                       |                     | copies data     v
                       |                     v           +-----------+
                       |             +--------------+    | Thumbnail |
                       |             | Read replica |    |  worker   |
                       |             |   (reads)    |    +-----+-----+
                       |             +--------------+          |
                       |                                       |
                       |   original photo (saved by            | thumbnail
                       |   the app servers)                    |
                       v                                       v
                 +----------------------------------------------------+
                 |                  Object storage                    |
                 |       originals (2 MB)  +  thumbnails (50 KB)      |
                 +----------------------------------------------------+
```
 
How to read it:
- **Photo path (left):** the user's device asks the CDN for a photo. If the CDN does not have it, it fetches it from object storage and keeps a copy for the next person.
- **API path (right):** requests go through the load balancer to an app server. For feeds, the app server checks the cache first and, if the answer is not there, reads from the read replica.
- **Upload path:** the app server saves the original photo to object storage, records the photo in the primary database, and puts a thumbnail job on the queue. The worker later saves the thumbnail to object storage.
## 7. What each component does
 
- **CDN:** it keeps copies of popular photos on servers close to users, so images load quickly for people far from our data center and most image requests never reach our own servers.
- **Load balancer:** it spreads incoming requests across the app servers and stops sending traffic to any server that fails, so no single server is overloaded or a single point of failure.
- **App servers:** they run the app's logic (login, feeds, uploads) and are all identical and stateless, so we can add more of them when traffic grows.
- **Cache:** it keeps frequently requested results, such as a user's recent feed, in fast memory, so the database is not asked the same question again and again.
- **Primary database:** it is the one trusted place where all writes go, storing users, follows and photo records (not the photo files).
- **Read replica:** it is a live copy of the primary database that answers feed reads, so the 50-to-1 flood of reads does not slow down writes on the primary.
- **Object storage:** it stores the photo files cheaply and safely at a scale (hundreds of terabytes a year) that a normal database could not handle.
- **Queue:** it holds thumbnail jobs, so an upload can finish quickly and sudden bursts of uploads wait in line instead of overwhelming the system.
- **Thumbnail worker:** it takes jobs from the queue and makes the 50 KB thumbnails in the background, and we can run more workers if the queue grows.
## 8. Upload flow, step by step
 
1. The user picks a photo and the app sends it over HTTPS to SnapShare.
2. The load balancer forwards the request to a healthy app server.
3. The app server checks that the user is logged in and that the file is valid (an image type, within the size limit).
4. The app server saves the original photo to object storage and gets back its key (file location).
5. The app server writes a photo record to the primary database: owner, file key, time, and a status of "processing".
6. The app server puts a "make a thumbnail" job on the queue and tells the user the upload succeeded. The user is not kept waiting for the thumbnail.
7. A thumbnail worker takes the job from the queue, downloads the original, makes a 50 KB thumbnail, and saves it to object storage. If the worker fails, the job stays in the queue and is retried.
8. The worker updates the photo record with the thumbnail's key and sets the status to "ready".
9. When followers load their feed, the app reads the list from the cache or read replica, and their devices load the thumbnails through the CDN.
## 9. Trade-offs
 
- **Read replica: speed versus freshness.** Reads are fast and the primary is protected, but the replica can lag slightly behind, so a user might not see their own brand-new photo right away. We accept this and can show a user's own upload straight from the upload response.
- **Cache: speed versus staleness and complexity.** A cache removes most repeated database queries, but cached feeds can be a little out of date, we need rules for when to clear them, and the cache is one more thing to run and pay for.
- **Thumbnails made in the background: fast uploads versus a short wait.** Uploads return quickly, but the thumbnail is not ready for a few seconds, so the feed may show a placeholder for a new photo. It also adds a queue and a worker to run and monitor.
- **Storing two files per photo: extra storage versus faster feeds.** Thumbnails add only 2.5% to storage (about 18 TB a year) but make each feed image 40 times smaller to send, which saves a huge amount of traffic.
- **Uploads through our app servers: simplicity versus load.** Passing uploads through app servers lets us check every file, but at peak that is about 116 MB per second (58 photos x 2 MB) of upload data. At larger scale we could let apps upload directly to object storage instead, at the cost of a more complicated flow.
 