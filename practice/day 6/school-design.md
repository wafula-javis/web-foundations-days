# School Database Design

## Tables

### students
Stores one row per student.
- `id` - primary key, uniquely identifies the student.
- `name` - the student's full name (required).
- `email` - the student's email (required and `UNIQUE`, so two students can never share one).

### courses
Stores one row per course offered.
- `id` - primary key.
- `title` - the course name (required).
- `credits` - how many credits the course is worth (required).

### enrolments
Stores one row for each time a student is enrolled on a course. It is the link between the other two tables and is where the grade lives.
- `id` - primary key.
- `student_id` - foreign key pointing to `students.id` (required).
- `course_id` - foreign key pointing to `courses.id` (required).
- `grade` - the student's mark from 0 to 100. It is allowed to be `NULL`, meaning "enrolled but not graded yet".
- A `UNIQUE (student_id, course_id)` rule stops the same student being enrolled on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses: many-to-many.** A student can take many courses, and a course can have many students.

**Why a join table is needed.** A relational table can't hold a many-to-many relationship directly. Putting a list of course IDs inside a student row would break the one-value-per-column rule and make queries such as "all students on this course" very awkward. The `enrolments` table solves this by turning the many-to-many relationship into two one-to-many relationships. It is also the natural home for the grade, because a grade belongs to the pairing of one student and one course, not to either of them on its own.

## Index

I would add an index on `enrolments (course_id)`:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

**Reason:** the `UNIQUE (student_id, course_id)` rule already creates an index that makes lookups by `student_id` fast, but it can't help when searching by `course_id` alone. Queries like "all students on one course" and "number of students per course" filter and group by `course_id`, so without this index the database would have to read every enrolment row. The cost is slightly slower inserts and a little extra storage, which is a good trade for a table that will grow the most.

## SQL or NoSQL?

I would choose SQL (a relational database) for this system. School data is structured and highly connected: students, courses and enrolments always have the same shape and refer to each other. SQL lets the database enforce the rules for us, so foreign keys stop an enrolment pointing at a student who doesn't exist, and the unique rule stops duplicate enrolments, which matters when the data is something as important as grades. The questions a school asks, such as who is on a course, how many students each course has, and who hasn't enrolled anywhere, are joins and counts, which SQL is built for. A NoSQL document database would suit data with a flexible or constantly changing shape, or a system that needs to spread across many servers, but at a school's scale it would mean copying course details into every student record and risking them going out of sync.