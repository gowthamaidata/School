/**
 * Bilingual dictionary — English / தமிழ்
 *
 * Tamil translations use terminology familiar in Tamil Nadu matriculation
 * and CBSE schools (e.g. தாளாளர் for Correspondent, மாற்றுச் சான்றிதழ் for TC).
 */

export type Locale = 'en' | 'ta'

export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
]

const dict = {
  // ── Brand / generic ──────────────────────────────────────
  'app.name': { en: 'Palli', ta: 'பள்ளி' },
  'app.tagline': {
    en: 'School management, built for Tamil Nadu',
    ta: 'தமிழ்நாட்டுப் பள்ளிகளுக்கான மேலாண்மை தளம்',
  },
  'common.loading': { en: 'Loading…', ta: 'ஏற்றுகிறது…' },
  'common.save': { en: 'Save', ta: 'சேமி' },
  'common.saving': { en: 'Saving…', ta: 'சேமிக்கிறது…' },
  'common.saved': { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  'common.cancel': { en: 'Cancel', ta: 'ரத்து' },
  'common.confirm': { en: 'Confirm', ta: 'உறுதிசெய்' },
  'common.areYouSure': { en: 'Are you sure?', ta: 'நிச்சயமாகவா?' },
  'common.close': { en: 'Close', ta: 'மூடு' },
  'common.search': { en: 'Search', ta: 'தேடு' },
  'common.filter': { en: 'Filter', ta: 'வடிகட்டு' },
  'common.all': { en: 'All', ta: 'அனைத்தும்' },
  'common.none': { en: 'None', ta: 'எதுவுமில்லை' },
  'common.total': { en: 'Total', ta: 'மொத்தம்' },
  'common.export': { en: 'Export', ta: 'ஏற்றுமதி' },
  'common.print': { en: 'Print', ta: 'அச்சிடு' },
  'common.back': { en: 'Back', ta: 'பின்செல்' },
  'common.next': { en: 'Next', ta: 'அடுத்து' },
  'common.submit': { en: 'Submit', ta: 'சமர்ப்பி' },
  'common.send': { en: 'Send', ta: 'அனுப்பு' },
  'common.viewAll': { en: 'View all', ta: 'அனைத்தையும் காண்க' },
  'common.today': { en: 'Today', ta: 'இன்று' },
  'common.class': { en: 'Class', ta: 'வகுப்பு' },
  'common.section': { en: 'Section', ta: 'பிரிவு' },
  'common.name': { en: 'Name', ta: 'பெயர்' },
  'common.status': { en: 'Status', ta: 'நிலை' },
  'common.actions': { en: 'Actions', ta: 'செயல்கள்' },
  'common.date': { en: 'Date', ta: 'தேதி' },
  'common.amount': { en: 'Amount', ta: 'தொகை' },
  'common.phone': { en: 'Phone', ta: 'தொலைபேசி' },
  'common.noResults': { en: 'No results found', ta: 'முடிவுகள் இல்லை' },
  'common.optional': { en: 'optional', ta: 'விருப்பத்தேர்வு' },
  'common.retry': { en: 'Try again', ta: 'மீண்டும் முயற்சி' },
  'common.error': { en: 'Something went wrong', ta: 'ஏதோ தவறாகிவிட்டது' },
  'common.errorHint': {
    en: 'The data could not be loaded. Check your connection and try again.',
    ta: 'தரவை ஏற்ற முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
  },
  'common.clearFilters': { en: 'Clear filters', ta: 'வடிகட்டியை நீக்கு' },
  'common.showingOf': { en: 'Showing {a}–{b} of {n}', ta: 'மொத்தம் {n}-ல் {a}–{b} காட்டப்படுகிறது' },
  'common.previous': { en: 'Previous', ta: 'முந்தையது' },
  'common.students': { en: 'students', ta: 'மாணவர்கள்' },
  'common.sections': { en: 'sections', ta: 'வகுப்புகள்' },
  'common.families': { en: 'families', ta: 'குடும்பங்கள்' },
  'common.records': { en: 'records', ta: 'பதிவுகள்' },

  // ── Time-of-day greeting ─────────────────────────────────
  'greet.morning': { en: 'Good morning', ta: 'காலை வணக்கம்' },
  'greet.afternoon': { en: 'Good afternoon', ta: 'மதிய வணக்கம்' },
  'greet.evening': { en: 'Good evening', ta: 'மாலை வணக்கம்' },

  // ── Navigation ───────────────────────────────────────────
  'nav.dashboard': { en: 'Dashboard', ta: 'முகப்பு' },
  'nav.attendance': { en: 'Attendance', ta: 'வருகைப் பதிவு' },
  'nav.students': { en: 'Students', ta: 'மாணவர்கள்' },
  'nav.staff': { en: 'Staff', ta: 'ஆசிரியர்கள்' },
  'nav.fees': { en: 'Fees', ta: 'கட்டணம்' },
  'nav.exams': { en: 'Exams & Marks', ta: 'தேர்வு & மதிப்பெண்' },
  'nav.communication': { en: 'Messages', ta: 'செய்திகள்' },
  'nav.homework': { en: 'Homework', ta: 'வீட்டுப்பாடம்' },
  'nav.reportCards': { en: 'Report Cards', ta: 'மதிப்பெண் அட்டை' },
  'nav.settings': { en: 'Settings', ta: 'அமைப்புகள்' },
  'nav.myChild': { en: 'My Child', ta: 'என் குழந்தை' },
  'nav.signOut': { en: 'Sign out', ta: 'வெளியேறு' },
  'nav.more': { en: 'More', ta: 'மேலும்' },
  'nav.menu': { en: 'Menu', ta: 'பட்டி' },
  'nav.openMenu': { en: 'Open menu', ta: 'பட்டியைத் திற' },
  'nav.searchHint': { en: 'Search or jump to…', ta: 'தேடு அல்லது செல்…' },
  'nav.skipToContent': { en: 'Skip to content', ta: 'உள்ளடக்கத்திற்குச் செல்' },
  'nav.groupDaily': { en: 'Every day', ta: 'தினசரி' },
  'nav.groupAcademics': { en: 'Academics', ta: 'கல்வி' },
  'nav.groupOffice': { en: 'Office', ta: 'அலுவலகம்' },
  'nav.groupPeople': { en: 'People', ta: 'நபர்கள்' },

  // ── Roles ────────────────────────────────────────────────
  'role.principal': { en: 'Principal', ta: 'தலைமையாசிரியர்' },
  'role.correspondent': { en: 'Correspondent', ta: 'தாளாளர்' },
  'role.admin': { en: 'Office Admin', ta: 'அலுவலக நிர்வாகி' },
  'role.teacher': { en: 'Teacher', ta: 'ஆசிரியர்' },
  'role.parent': { en: 'Parent', ta: 'பெற்றோர்' },

  // ── Auth ─────────────────────────────────────────────────
  'auth.signIn': { en: 'Sign in', ta: 'உள்நுழை' },
  'auth.chooseRole': { en: 'Choose how to sign in', ta: 'உள்நுழையும் முறையைத் தேர்ந்தெடுக்கவும்' },
  'auth.demoNote': {
    en: 'Demo mode — pick any role to explore. No password needed.',
    ta: 'செயல்விளக்க முறை — எந்தப் பணியையும் தேர்ந்தெடுக்கவும். கடவுச்சொல் தேவையில்லை.',
  },
  'auth.email': { en: 'Email', ta: 'மின்னஞ்சல்' },
  'auth.password': { en: 'Password', ta: 'கடவுச்சொல்' },
  'auth.signInAs': { en: 'Continue as', ta: 'இவராக தொடர்' },

  // ── Dashboard ────────────────────────────────────────────
  'dash.title': { en: 'School at a glance', ta: 'பள்ளி நிலை ஒரே பார்வையில்' },
  'dash.attendanceToday': { en: "Today's attendance", ta: 'இன்றைய வருகை' },
  'dash.feeCollected': { en: 'Fees collected', ta: 'வசூலான கட்டணம்' },
  'dash.feePending': { en: 'Fees pending', ta: 'நிலுவைக் கட்டணம்' },
  'dash.totalStudents': { en: 'Total students', ta: 'மொத்த மாணவர்கள்' },
  'dash.presentToday': { en: 'present today', ta: 'இன்று வருகை' },
  'dash.absentToday': { en: 'Absent today', ta: 'இன்று வரவில்லை' },
  'dash.ofTarget': { en: 'of term target', ta: 'பருவ இலக்கில்' },
  'dash.lowAttendance': { en: 'Low attendance alerts', ta: 'குறைந்த வருகை எச்சரிக்கை' },
  'dash.lowAttendanceHelp': {
    en: 'Students below 75% this term — TN board requires 75% to sit exams',
    ta: 'இப்பருவத்தில் 75%க்கும் குறைவானோர் — தேர்வெழுத 75% வருகை அவசியம்',
  },
  'dash.feeDefaulters': { en: 'Fee follow-up needed', ta: 'கட்டணம் தொடர்பு தேவை' },
  'dash.upcomingExams': { en: 'Upcoming exams', ta: 'வரவிருக்கும் தேர்வுகள்' },
  'dash.classwiseAttendance': { en: 'Attendance by class', ta: 'வகுப்பு வாரியாக வருகை' },
  'dash.recentActivity': { en: 'Recent activity', ta: 'சமீபத்திய செயல்பாடுகள்' },
  'dash.collectionTrend': { en: 'Fee collection trend', ta: 'கட்டண வசூல் போக்கு' },
  'dash.sendReminders': { en: 'Send reminders', ta: 'நினைவூட்டல் அனுப்பு' },
  'dash.notMarkedYet': { en: 'Attendance not marked', ta: 'வருகை பதிவு செய்யப்படவில்லை' },
  'dash.classesPending': { en: 'classes pending', ta: 'வகுப்புகள் நிலுவையில்' },
  'dash.needsYou': { en: 'Needs you today', ta: 'இன்று உங்கள் கவனம் தேவை' },
  'dash.allClear': { en: 'Nothing needs you right now', ta: 'இப்போது கவனம் தேவைப்படுவது எதுவும் இல்லை' },
  'dash.allClearHint': {
    en: 'Every class is marked and no family is overdue. The school is running clean today.',
    ta: 'அனைத்து வகுப்புகளும் பதிவாகிவிட்டன, நிலுவைக் குடும்பங்களும் இல்லை.',
  },
  'dash.marked': { en: 'marked', ta: 'பதிவானது' },
  'dash.pendingClasses': { en: 'Mark the remaining classes', ta: 'மீதமுள்ள வகுப்புகளைப் பதிவு செய்' },
  'dash.remindFamilies': { en: 'Remind pending families', ta: 'நிலுவைக் குடும்பங்களுக்கு நினைவூட்டு' },
  'dash.reviewStudents': { en: 'Review students below 75%', ta: '75%க்குக் கீழ் உள்ள மாணவர்களைப் பார்' },
  'dash.attendanceByGrade': { en: 'By class, right now', ta: 'இப்போதைய வகுப்பு நிலை' },
  'dash.target': { en: 'Target', ta: 'இலக்கு' },
  'dash.collected': { en: 'Collected', ta: 'வசூலானது' },
  'dash.yourClass': { en: 'Your class', ta: 'உங்கள் வகுப்பு' },

  // ── Attendance ───────────────────────────────────────────
  'att.title': { en: 'Mark attendance', ta: 'வருகை பதிவு செய்' },
  'att.selectClass': { en: 'Select your class', ta: 'உங்கள் வகுப்பைத் தேர்ந்தெடுக்கவும்' },
  'att.present': { en: 'Present', ta: 'வருகை' },
  'att.absent': { en: 'Absent', ta: 'வரவில்லை' },
  'att.late': { en: 'Late', ta: 'தாமதம்' },
  'att.markAllPresent': { en: 'Mark all present', ta: 'அனைவரும் வருகை' },
  'att.submitAttendance': { en: 'Submit attendance', ta: 'வருகையைச் சமர்ப்பி' },
  'att.submitted': { en: 'Attendance submitted', ta: 'வருகை சமர்ப்பிக்கப்பட்டது' },
  'att.alreadyMarked': { en: 'Already marked today', ta: 'இன்று ஏற்கனவே பதிவு செய்யப்பட்டது' },
  'att.parentsNotified': {
    en: 'Parents of absent students will be notified',
    ta: 'வராத மாணவர்களின் பெற்றோருக்குத் தகவல் அனுப்பப்படும்',
  },
  'att.rollNo': { en: 'Roll', ta: 'எண்' },
  'att.percentThisTerm': { en: 'This term', ta: 'இப்பருவம்' },
  'att.searchStudent': { en: 'Find a student in this class', ta: 'இந்த வகுப்பில் மாணவரைத் தேடு' },
  'att.remaining': { en: 'still to mark', ta: 'பதிவு செய்ய மீதம்' },
  'att.markRestPresent': { en: 'Mark the rest present', ta: 'மீதமுள்ளோர் வருகை' },
  'att.readyToSubmit': { en: 'Ready to submit', ta: 'சமர்ப்பிக்கத் தயார்' },
  'att.everyoneMarked': { en: 'Everyone is marked', ta: 'அனைவரும் பதிவாகிவிட்டனர்' },
  'att.clearMarks': { en: 'Start over', ta: 'மீண்டும் தொடங்கு' },
  'att.tookSeconds': { en: 'Took {n}s', ta: '{n} வினாடி' },
  'att.offlineNote': {
    en: 'Saved on this device. Will sync when you are back online.',
    ta: 'இச்சாதனத்தில் சேமிக்கப்பட்டது. இணையம் வந்ததும் ஒத்திசைக்கப்படும்.',
  },

  // ── Students ─────────────────────────────────────────────
  'stu.title': { en: 'Student directory', ta: 'மாணவர் பட்டியல்' },
  'stu.admissionNo': { en: 'Admission no.', ta: 'சேர்க்கை எண்' },
  'stu.father': { en: 'Father', ta: 'தந்தை' },
  'stu.mother': { en: 'Mother', ta: 'தாய்' },
  'stu.guardianPhone': { en: 'Guardian phone', ta: 'பாதுகாவலர் தொலைபேசி' },
  'stu.dob': { en: 'Date of birth', ta: 'பிறந்த தேதி' },
  'stu.bloodGroup': { en: 'Blood group', ta: 'இரத்தப் பிரிவு' },
  'stu.address': { en: 'Address', ta: 'முகவரி' },
  'stu.importExcel': { en: 'Import from Excel', ta: 'எக்செல்-ல் இருந்து இறக்குமதி' },
  'stu.profile': { en: 'Student profile', ta: 'மாணவர் விவரம்' },
  'stu.attendanceRate': { en: 'Attendance', ta: 'வருகை விகிதம்' },
  'stu.feeStatus': { en: 'Fee status', ta: 'கட்டண நிலை' },

  // ── Staff ────────────────────────────────────────────────
  'staff.title': { en: 'Staff directory', ta: 'பணியாளர் பட்டியல்' },
  'staff.designation': { en: 'Designation', ta: 'பதவி' },
  'staff.subjects': { en: 'Subjects', ta: 'பாடங்கள்' },
  'staff.classTeacherOf': { en: 'Class teacher of', ta: 'வகுப்பாசிரியர்' },

  // ── Fees ─────────────────────────────────────────────────
  'fee.title': { en: 'Fee management', ta: 'கட்டண மேலாண்மை' },
  'fee.paid': { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  'fee.pending': { en: 'Pending', ta: 'நிலுவை' },
  'fee.partial': { en: 'Partial', ta: 'பகுதி' },
  'fee.overdue': { en: 'Overdue', ta: 'காலம் கடந்தது' },
  'fee.term': { en: 'Term', ta: 'பருவம்' },
  'fee.dueDate': { en: 'Due date', ta: 'கடைசி தேதி' },
  'fee.collectPayment': { en: 'Record payment', ta: 'பணம் பதிவு' },
  'fee.receipt': { en: 'Receipt', ta: 'ரசீது' },
  'fee.sendReminder': { en: 'Send reminder', ta: 'நினைவூட்டல் அனுப்பு' },
  'fee.remindPending': { en: 'Remind all pending families', ta: 'நிலுவையுள்ள அனைவருக்கும் நினைவூட்டு' },
  'fee.collectionRate': { en: 'Collection rate', ta: 'வசூல் விகிதம்' },
  'fee.outstanding': { en: 'Outstanding', ta: 'நிலுவைத் தொகை' },
  'fee.remindersSent': { en: 'Reminders sent to {n} families', ta: '{n} குடும்பங்களுக்கு நினைவூட்டல் அனுப்பப்பட்டது' },

  // ── Exams ────────────────────────────────────────────────
  'exam.title': { en: 'Exams & marks', ta: 'தேர்வுகள் & மதிப்பெண்கள்' },
  'exam.examination': { en: 'Examination', ta: 'தேர்வு' },
  'exam.enterMarks': { en: 'Enter marks', ta: 'மதிப்பெண் பதிவு' },
  'exam.subject': { en: 'Subject', ta: 'பாடம்' },
  'exam.maxMarks': { en: 'Max marks', ta: 'அதிகபட்ச மதிப்பெண்' },
  'exam.marksObtained': { en: 'Marks', ta: 'மதிப்பெண்' },
  'exam.grade': { en: 'Grade', ta: 'தரம்' },
  'exam.rank': { en: 'Rank', ta: 'தரவரிசை' },
  'exam.classAverage': { en: 'Class average', ta: 'வகுப்புச் சராசரி' },
  'exam.passPercent': { en: 'Pass %', ta: 'தேர்ச்சி %' },
  'exam.generateReportCard': { en: 'Generate report card', ta: 'மதிப்பெண் அட்டை உருவாக்கு' },
  'exam.absent': { en: 'AB', ta: 'வ.இ' },

  // ── Report card ──────────────────────────────────────────
  'rc.title': { en: 'Report Card', ta: 'மதிப்பெண் அட்டை' },
  'rc.progressReport': { en: 'Progress Report', ta: 'முன்னேற்ற அறிக்கை' },
  'rc.academicYear': { en: 'Academic Year', ta: 'கல்வியாண்டு' },
  'rc.totalMarks': { en: 'Total', ta: 'மொத்தம்' },
  'rc.percentage': { en: 'Percentage', ta: 'சதவீதம்' },
  'rc.result': { en: 'Result', ta: 'முடிவு' },
  'rc.pass': { en: 'PASS', ta: 'தேர்ச்சி' },
  'rc.fail': { en: 'FAIL', ta: 'தேர்ச்சியில்லை' },
  'rc.remarks': { en: 'Class teacher remarks', ta: 'வகுப்பாசிரியர் கருத்து' },
  'rc.signature': { en: 'Signature', ta: 'கையொப்பம' },
  'rc.classTeacher': { en: 'Class Teacher', ta: 'வகுப்பாசிரியர்' },
  'rc.principalSign': { en: 'Principal', ta: 'தலைமையாசிரியர்' },
  'rc.parentSign': { en: 'Parent', ta: 'பெற்றோர்' },
  'rc.daysPresent': { en: 'Days present', ta: 'வருகை நாட்கள்' },
  'rc.workingDays': { en: 'Working days', ta: 'வேலை நாட்கள்' },

  // ── Communication ────────────────────────────────────────
  'msg.title': { en: 'Parent messages', ta: 'பெற்றோர் செய்திகள்' },
  'msg.compose': { en: 'New announcement', ta: 'புதிய அறிவிப்பு' },
  'msg.subjectLine': { en: 'Subject', ta: 'தலைப்பு' },
  'msg.body': { en: 'Message', ta: 'செய்தி' },
  'msg.audience': { en: 'Send to', ta: 'யாருக்கு' },
  'msg.allParents': { en: 'All parents', ta: 'அனைத்துப் பெற்றோர்' },
  'msg.byClass': { en: 'Specific class', ta: 'குறிப்பிட்ட வகுப்பு' },
  'msg.sent': { en: 'Sent', ta: 'அனுப்பப்பட்டது' },
  'msg.delivered': { en: 'delivered', ta: 'சேர்ந்தது' },
  'msg.read': { en: 'read', ta: 'படித்தது' },
  'msg.recipients': { en: 'recipients', ta: 'பெறுநர்கள்' },
  'msg.whatsappNote': {
    en: 'Also delivered to parents on WhatsApp',
    ta: 'பெற்றோருக்கு வாட்ஸ்அப்பிலும் அனுப்பப்படும்',
  },
  'msg.channelPortal': { en: 'Parent app', ta: 'பெற்றோர் செயலி' },
  'msg.channelWhatsapp': { en: 'WhatsApp', ta: 'வாட்ஸ்அப்' },
  'msg.channelSms': { en: 'SMS', ta: 'குறுஞ்செய்தி' },

  // ── Parent portal ────────────────────────────────────────
  // ── Homework ─────────────────────────────────────────────
  'hw.title': { en: 'Homework', ta: 'வீட்டுப்பாடம்' },
  'hw.assign': { en: 'Assign homework', ta: 'வீட்டுப்பாடம் கொடு' },
  'hw.subject': { en: 'Subject', ta: 'பாடம்' },
  'hw.workTitle': { en: 'Title', ta: 'தலைப்பு' },
  'hw.details': { en: 'What to do', ta: 'என்ன செய்ய வேண்டும்' },
  'hw.dueOn': { en: 'Submit by', ta: 'சமர்ப்பிக்க வேண்டிய நாள்' },
  'hw.assignedOn': { en: 'Given on', ta: 'கொடுத்த நாள்' },
  'hw.posted': { en: 'Homework posted', ta: 'வீட்டுப்பாடம் பதிவிடப்பட்டது' },
  'hw.deleted': { en: 'Homework removed', ta: 'வீட்டுப்பாடம் நீக்கப்பட்டது' },
  'hw.none': { en: 'No homework yet', ta: 'இன்னும் வீட்டுப்பாடம் இல்லை' },
  'hw.noneToday': { en: 'No homework today', ta: 'இன்று வீட்டுப்பாடம் இல்லை' },
  'hw.todaysWork': { en: "Today's homework", ta: 'இன்றைய வீட்டுப்பாடம்' },
  'hw.dueTomorrow': { en: 'Due tomorrow', ta: 'நாளை சமர்ப்பிக்க வேண்டும்' },
  'hw.dueToday': { en: 'Due today', ta: 'இன்று சமர்ப்பிக்க வேண்டும்' },
  'hw.overdue': { en: 'Overdue', ta: 'காலம் கடந்தது' },
  'hw.recent': { en: 'Earlier this week', ta: 'இந்த வாரம் முன்பு' },
  'hw.coverage': { en: 'Homework posted today', ta: 'இன்று பதிவிட்ட வகுப்புகள்' },
  'hw.coverageHelp': {
    en: 'Classes that have not posted homework today',
    ta: 'இன்று வீட்டுப்பாடம் பதிவிடாத வகுப்புகள்',
  },
  'hw.classesPending': { en: 'classes have not posted yet', ta: 'வகுப்புகள் இன்னும் பதிவிடவில்லை' },
  'hw.allPosted': { en: 'Every class has posted homework today', ta: 'இன்று அனைத்து வகுப்புகளும் பதிவிட்டுவிட்டன' },
  'hw.parentsNotified': {
    en: 'Parents of this class can see it immediately',
    ta: 'இந்த வகுப்புப் பெற்றோர் உடனே பார்க்கலாம்',
  },
  'hw.selectClass': { en: 'Select class', ta: 'வகுப்பைத் தேர்ந்தெடு' },
  'hw.thisWeek': { en: 'This week', ta: 'இந்த வாரம்' },
  'hw.itemsThisWeek': { en: 'assignments this week', ta: 'இந்த வாரப் பணிகள்' },
  'hw.delete': { en: 'Remove', ta: 'நீக்கு' },
  'hw.placeholderTitle': {
    en: 'e.g. Exercise 6.3 — Trigonometry',
    ta: 'எ.கா. பயிற்சி 6.3 — முக்கோணவியல்',
  },
  'hw.placeholderBody': {
    en: 'Page numbers, sums to solve, what to bring tomorrow…',
    ta: 'பக்க எண்கள், செய்ய வேண்டிய கணக்குகள், நாளை கொண்டுவர வேண்டியவை…',
  },

  'par.greeting': { en: 'Hello', ta: 'வணக்கம்' },
  'par.homework': { en: "Your child's homework", ta: 'உங்கள் குழந்தையின் வீட்டுப்பாடம்' },
  'par.attendanceSummary': { en: 'Attendance this term', ta: 'இப்பருவ வருகை' },
  'par.feeDue': { en: 'Fee due', ta: 'செலுத்த வேண்டிய கட்டணம்' },
  'par.latestMarks': { en: 'Latest exam results', ta: 'சமீபத்திய தேர்வு முடிவுகள்' },
  'par.announcements': { en: 'School announcements', ta: 'பள்ளி அறிவிப்புகள்' },
  'par.payNow': { en: 'Pay now', ta: 'இப்போது செலுத்து' },
  'par.viewReportCard': { en: 'View report card', ta: 'மதிப்பெண் அட்டையைக் காண்க' },
  'par.noDues': { en: 'No dues. Thank you!', ta: 'நிலுவை இல்லை. நன்றி!' },

  // ── Settings ─────────────────────────────────────────────
  'set.title': { en: 'Settings', ta: 'அமைப்புகள்' },
  'set.language': { en: 'Language', ta: 'மொழி' },
  'set.theme': { en: 'Appearance', ta: 'தோற்றம்' },
  'set.themeLight': { en: 'Light', ta: 'வெளிச்சம்' },
  'set.themeDark': { en: 'Dark', ta: 'இருள்' },
  'set.schoolProfile': { en: 'School profile', ta: 'பள்ளி விவரம்' },
  'set.dataMode': { en: 'Data source', ta: 'தரவு மூலம்' },
  'set.installApp': { en: 'Install app', ta: 'செயலியை நிறுவு' },
  'set.installHelp': {
    en: 'Add to your home screen for one-tap access',
    ta: 'ஒரே தட்டலில் திறக்க முகப்புத் திரையில் சேர்க்கவும்',
  },
} as const

export type TranslationKey = keyof typeof dict

export function translate(key: TranslationKey, locale: Locale): string {
  const entry = dict[key]
  if (!entry) return key
  return entry[locale] ?? entry.en
}

export default dict
