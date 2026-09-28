const config = {
  competitionName: "Ganpati Agman 2026",
  clubName: "Marathi Club",
  collegeName: "Ganesh Chaturthi Celebrations",
  aboutClub: "The Marathi Club brings together everyone who loves Maharashtrian culture, food, and festivals. Every year we celebrate Ganesh Chaturthi with an Agman (welcome) competition — decorations, art, and performances shared by our own community.",

  submissionDeadline: "2026-09-27T23:59:59+05:30",
  votingDeadline: "2026-09-30T23:59:59+05:30",
  votingRule: "one_per_category",
  showVoteCountsPublicly: true,

  categories: [
    {
      key: "home-decor",
      marathi: "घरगुती सजावट",
      image: "/images/cat-decoration.jpg",
      label: "Home Decor",
      description: "Home Ganpati decoration setups, eco-friendly themes, and mandap designs.",
      instructions: "Submit clear photos (up to 6) or a video reel of your setup.",
      allowedExt: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],
      allowedMime: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"],
      maxFileSizeMB: 15,
      maxVideoSizeMB: 150,
      maxFiles: 6,
    },
    {
      key: "reels",
      marathi: "रील्स आणि व्हिडिओ",
      image: "/images/cat-reels.jpg",
      label: "Reels & Videography",
      description: "Ganpati celebration reels, aarti moments, mandal darshan, and videography.",
      instructions: "Upload a short celebration video or reel (under 90s).",
      allowedExt: ["mp4", "mov", "webm", "jpg", "jpeg", "png", "webp"],
      allowedMime: ["video/mp4", "video/quicktime", "video/webm", "image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 15,
      maxVideoSizeMB: 150,
      maxFiles: 3,
    },
    {
      key: "literature",
      marathi: "काव्य आणि साहित्य",
      image: "/images/cat-literature.jpg",
      label: "Poetry & Literature",
      description: "Poetry, literature, and creative Marathi expressions dedicated to Bappa.",
      instructions: "Upload a PDF, photos of your written work, or a recitation reel.",
      allowedExt: ["pdf", "jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],
      allowedMime: ["application/pdf", "image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"],
      maxFileSizeMB: 20,
      maxVideoSizeMB: 150,
      maxFiles: 3,
    },
    {
      key: "artistic",
      marathi: "कला आणि कलाकृती",
      image: "/images/cat-artistic.jpg",
      label: "Artistic",
      description: "Handmade Ganpati idols, sketches, paintings, crafts, and artistic creations.",
      instructions: "Submit clear photos or a creation video/reel of your artwork.",
      allowedExt: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],
      allowedMime: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"],
      maxFileSizeMB: 15,
      maxVideoSizeMB: 150,
      maxFiles: 6,
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
