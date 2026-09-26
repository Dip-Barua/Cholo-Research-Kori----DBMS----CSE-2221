export const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: "LayoutDashboard", href: "#top" }],
  },
  {
    label: "Research",
    items: [
      { label: "Discover Research", icon: "Search", href: "#research-opportunities" },
      { label: "Research Projects", icon: "FolderKanban", href: "#active-research" },
      { label: "Research Labs", icon: "FlaskConical", href: "#research-network" },
      { label: "Researchers", icon: "Users", href: "#research-network" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { label: "My Collaborations", icon: "Handshake", href: "#research-network" },
      { label: "Requests", icon: "Inbox", href: "#quick-actions" },
      { label: "Messages", icon: "MessageSquareText", href: "#quick-actions" },
    ],
  },
  {
    label: "Research Management",
    items: [
      { label: "Tasks", icon: "CheckSquare", href: "#active-research" },
      { label: "Milestones", icon: "Milestone", href: "#upcoming-deadlines" },
      { label: "Publications", icon: "BookOpenText", href: "#research-opportunities" },
    ],
  },
];

export const statCards = [
  {
    title: "Active Projects",
    value: "4",
    trend: "+1 this month",
    icon: "FolderKanban",
  },
  {
    title: "Collaborators",
    value: "12",
    trend: "+2 new",
    icon: "Users",
  },
  {
    title: "Publications",
    value: "8",
    trend: "+2 this year",
    icon: "BookOpenText",
  },
  {
    title: "Research Progress",
    value: "68%",
    trend: "3 milestones upcoming",
    icon: "BarChart3",
  },
];

export const activeProjects = [
  {
    title: "Machine Learning for Climate Prediction",
    supervisor: "Dr. Sarah Rahman",
    members: 5,
    progress: 72,
    status: "In Progress",
    summary: "Building regional forecasting models for precipitation and extreme weather patterns.",
  },
  {
    title: "Bangla Natural Language Processing",
    supervisor: "Dr. Ahmed Hasan",
    members: 4,
    progress: 48,
    status: "Data Collection",
    summary: "Collecting and cleaning annotated corpora for downstream language understanding tasks.",
  },
  {
    title: "Cybersecurity Threat Detection",
    supervisor: "Dr. Nusrat Jahan",
    members: 6,
    progress: 85,
    status: "Paper Writing",
    summary: "Evaluating anomaly detection pipelines for phishing and network intrusion scenarios.",
  },
];

export const deadlines = [
  { title: "Literature Review", date: "Sep 18, 2026", priority: "High" },
  { title: "Dataset Submission", date: "Sep 22, 2026", priority: "Medium" },
  { title: "Paper Draft", date: "Sep 28, 2026", priority: "High" },
];

export const quickActions = [
  { label: "Start New Research", icon: "PlusCircle" },
  { label: "Find Collaborator", icon: "UsersRound" },
  { label: "Explore Research Labs", icon: "FlaskConical" },
  { label: "View My Requests", icon: "Inbox" },
];

export const opportunities = [
  {
    title: "Computer Vision for Medical Imaging",
    field: "Computer Vision",
    supervisor: "Dr. Rahman",
    skills: ["Python", "PyTorch", "Computer Vision"],
    openPositions: 2,
  },
  {
    title: "Climate Data Analysis",
    field: "Data Science",
    supervisor: "Dr. Hasan",
    skills: ["Python", "Pandas", "Machine Learning"],
    openPositions: 3,
  },
  {
    title: "Secure IoT Systems",
    field: "Cybersecurity",
    supervisor: "Dr. Jahan",
    skills: ["Cybersecurity", "IoT", "Embedded Systems"],
    openPositions: 2,
  },
];

export const researchNetwork = [
  {
    name: "Dr. Sarah Rahman",
    role: "Supervisor",
    department: "CSE",
    interests: "Machine Learning · NLP",
    status: "Connected",
    initials: "SR",
  },
  {
    name: "Tanvir Ahmed",
    role: "Researcher",
    department: "CSE",
    interests: "Computer Vision · Python",
    status: "Connected",
    initials: "TA",
  },
  {
    name: "Dr. Nusrat Jahan",
    role: "Supervisor",
    department: "ECE",
    interests: "Cybersecurity · IoT",
    status: "Available",
    initials: "NJ",
  },
  {
    name: "Sadia Rahman",
    role: "Researcher",
    department: "CSE",
    interests: "Health AI · Data Labeling",
    status: "Requested",
    initials: "SR",
  },
];

export const userProfile = {
  name: "Arafat Rahman",
  role: "Researcher",
  email: "arafat.rahman@university.edu",
  initials: "AR",
};
