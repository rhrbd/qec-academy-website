/* =====================================================================
   QEC Academy catalog (template data).
   One place for courses, Skill Hub programs and books. When the backend
   is ready, replace this file with an API call that returns the same shape.
   sample:true marks values that are placeholders (prices, dates, titles).
   ===================================================================== */
window.QEC_CATALOG = {
  courses: [
    { id: "pc4", cls: "4", title: "Pre-Cadet Foundation · Class 4", kind: "academic",
      blurb: "The base year: reading, number sense and clear English, built for the cadet track ahead.",
      subjects: ["Bangla", "English", "Mathematics", "Science", "General Knowledge"],
      features: ["Live classes on Google Meet with your own ID and PIN", "Weekly exam with a progress report", "Afternoon or Night batch"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "৳ ——", sample: true },
    { id: "pc5", cls: "5", title: "Pre-Cadet Builder · Class 5", kind: "academic",
      blurb: "Faster problem solving, written English and the first cadet-style model tests.",
      subjects: ["Bangla", "English", "Mathematics", "Science", "General Knowledge"],
      features: ["Live classes and class recordings", "Monthly cadet-pattern model test", "Afternoon or Night batch"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "৳ ——", sample: true },
    { id: "pc6", cls: "6", title: "Cadet Admission Ready · Class 6", kind: "academic",
      blurb: "Full admission preparation on the cadet college pattern: written test, viva and model tests.",
      subjects: ["Bangla", "English", "Mathematics", "General Knowledge"],
      features: ["Full syllabus on the admission pattern", "Model test series with merit list", "Viva and written practice"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "৳ ——", sample: true },
    { id: "mt6", cls: "6", title: "Cadet Model Test Series", kind: "exam",
      blurb: "Exam-only package for Class 6: timed papers, solve sheets and a ranked result after each test.",
      subjects: ["Bangla", "English", "Mathematics", "General Knowledge"],
      features: ["Online or at the centre", "Solve sheet after every test", "Academy-wide merit list"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "৳ ——", sample: true },
    { id: "free", cls: "all", title: "Free trial class", kind: "free",
      blurb: "Sit in a real live class with a QEC teacher before you enrol. Open to Class 4, 5 and 6.",
      subjects: ["Any subject"],
      features: ["One live class, no payment", "Meet the teacher and the batch", "Guardian follow-up call"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "Free", sample: false },
    { id: "ssc9", cls: "9", title: "Class 9 Academic Program", kind: "academic", upcoming: true,
      blurb: "Coming in 2027. Science, Business and Humanities groups with the same live-class system.",
      subjects: ["Bangla", "English", "Mathematics", "Science", "ICT"],
      features: ["Opening for the 2027 session", "Register interest to get the launch date"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "Opening 2027", sample: true },
    { id: "ssc10", cls: "10", title: "Class 10 · SSC Preparation", kind: "academic", upcoming: true,
      blurb: "Coming in 2027. Board-exam preparation with chapter tests, model tests and revision.",
      subjects: ["Bangla", "English", "Mathematics", "Science", "ICT"],
      features: ["Opening for the 2027 session", "Register interest to get the launch date"],
      versions: ["BV", "EV"], modes: ["online", "offline"], price: "Opening 2027", sample: true }
  ],
  skills: [
    { id: "olympiad", title: "Math Olympiad", for: "Class 4–6",
      blurb: "Logic, patterns and contest problems, with practice rounds on the olympiad format." },
    { id: "grammar", title: "English Grammar", for: "Class 4–6",
      blurb: "Rules made simple and practised until they stick, for school and the admission test." },
    { id: "spoken", title: "Spoken English", for: "Class 4–6",
      blurb: "Speaking every class: introductions, storytelling and viva practice in small groups." },
    { id: "code", title: "Programming for Kids", for: "Class 4–6",
      blurb: "Build games and animations with block coding, then a first step into Python." }
  ],
  books: [
    { id: "m4", series: "QEC Mastering", title: "Math Mastering", cls: "Class 4", color: "#5b1462", price: "৳ ——" },
    { id: "m5", series: "QEC Mastering", title: "Math Mastering", cls: "Class 5", color: "#8a3f93", price: "৳ ——" },
    { id: "m6", series: "QEC Mastering", title: "Math Mastering", cls: "Class 6", color: "#45104b", price: "৳ ——" },
    { id: "e6", series: "QEC Mastering", title: "English Mastering", cls: "Class 4–6", color: "#3a2a6b", price: "৳ ——" },
    { id: "b6", series: "QEC Mastering", title: "Bangla Mastering", cls: "Class 4–6", color: "#b0472c", price: "৳ ——" },
    { id: "g6", series: "QEC Mastering", title: "GK Mastering", cls: "Class 4–6", color: "#2d6a5a", price: "৳ ——" },
    { id: "mt", series: "QEC Exam Series", title: "Cadet Model Tests", cls: "Class 6", color: "#2a0730", price: "৳ ——" },
    { id: "ol", series: "QEC Skill Hub", title: "Olympiad Practice", cls: "Class 4–6", color: "#c9861a", price: "৳ ——" }
  ]
};
