import { builtinCourses } from "../src/content";
import { validateCourse } from "../src/lib/course-validation";
let bad = 0;
for (const c of builtinCourses) {
  const { problems } = validateCourse(c);
  console.log(c.id, problems.length ? problems : "OK");
  bad += problems.length;
}
process.exit(bad ? 1 : 0);
