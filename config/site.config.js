const config = {
  competitionName: "Ganpati Agman 2026",
  clubName: "Marathi Club",
  collegeName: "Ganesh Chaturthi Celebrations",
  aboutClub: "The Marathi Club brings together everyone who loves Maharashtrian culture, food, and festivals. Every year we celebrate Ganesh Chaturthi with an Agman (welcome) competition — decorations, art, and performances shared by our own community.",

  submissionDeadline: "2026-10-05T18:30:00+05:30",
  votingDeadline: "2026-10-15T23:59:00+05:30",
  votingRule: "one_per_category",
  showVoteCountsPublicly: true,

  categories: [
    {
      key: "decoration",
      marathi: "सजावट",
      image: "/images/cat-decoration.jpg",
      label: "Ganpati Decoration",
      description: "Home or mandal Ganpati decoration setups.",
      instructions: "Submit clear photos of your decoration, well-lit and from multiple angles.",
      allowedExt: ["jpg", "jpeg", "png", "webp"],
      allowedMime: ["image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 15,
      maxFiles: 3,
    },
    {
      key: "rangoli",
      marathi: "रांगोळी",
      image: "/images/cat-rangoli.jpg",
      label: "Rangoli",
      description: "Rangoli designs made for the festival.",
      instructions: "Photograph the rangoli in good daylight, straight-on if possible.",
      allowedExt: ["jpg", "jpeg", "png", "webp"],
      allowedMime: ["image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 15,
      maxFiles: 1,
    },
    {
      key: "literature",
      marathi: "काव्य / साहित्य",
      image: "/images/cat-literature.jpg",
      label: "Poetry / Literature",
      description: "Poetry, literature, or Marathi creative writing inspired by Ganpati Agman.",
      instructions: "Upload a PDF or clear photos/scans of handwritten or typed work.",
      allowedExt: ["pdf", "jpg", "jpeg", "png", "webp"],
      allowedMime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 20,
      maxFiles: 3,
    },
    {
      key: "artistic",
      marathi: "कला आणि रेखाटन",
      image: "/images/cat-artistic.jpg",
      label: "Artistic",
      description: "Ganpati sketches, paintings, digital art, drawings, or handcrafted creations.",
      instructions: "Submit clear photos of your original artwork or creative craft.",
      allowedExt: ["jpg", "jpeg", "png", "webp"],
      allowedMime: ["image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 15,
      maxFiles: 3,
    },
  ],

  photoCredits: [
    { what: "Dagadusheth Halwai Ganpati (hero & decoration)", author: "DesiBoy101", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Ganesha_idol_closeup_of_Dagadusheth_Halwai_Sarvajanik_Ganeshotsav_Mandal_in_2024.jpg" },
    { what: "Tulshibaug Ganpati", author: "DesiBoy101", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Ganesha_idol_closeup_of_Tulshibaug_Sarvajanik_Ganeshotsav_Mandal_in_2024.jpg" },
    { what: "Rangoli", author: "SreeramKalyan", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:A_Beautiful_Rangoli.jpg" },
    { what: "Diya thali", author: "Suyash Dwivedi", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Diye_ki_thali_01.jpg" },
  ],

  guidelines: {
    whoCanParticipate: "Open to all Marathi Club members and their families — anyone celebrating Ganpati with us this year.",
    submissionRules: [
      "Entries are collected and uploaded by the Marathi Club core team on behalf of participants.",
      "One entry per person per category.",
      "Content must be original and family-friendly.",
    ],
    votingRules: [
      "Sign in with Google to vote.",
      "One vote per category, per Google account.",
      "Votes cannot be changed once cast.",
    ],
    generalInstructions: [
      "Winners will be announced on the Marathi Club social channels after voting closes.",
      "Contact any core-team member with questions about your entry.",
    ],
  },
};

export default config;
