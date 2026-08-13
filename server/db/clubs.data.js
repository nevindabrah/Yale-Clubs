/**
 * YaleClubs — seed catalog of real Yale undergraduate organizations.
 *
 * SEE DECISIONS.md D-005.
 *   - `name`, `acronym`, `category`, `founded_year` and `description` describe
 *     REAL, publicly known Yale student organizations. Founding years are only
 *     included where they are well documented; omitted where uncertain.
 *   - `meeting_day` / `meeting_time` / `meeting_location` / `contact_email` /
 *     `application_deadline` / `size_estimate` / `commitment_hours` /
 *     `selectivity` / `rating` are SYNTHETIC DEMO VALUES. Real clubs change
 *     these every year and they are not reliably public. Contact addresses use
 *     the non-routable demo domain `clubs.yale.demo` so nothing here can be
 *     mistaken for a real inbox.
 */

const DEMO_DOMAIN = 'clubs.yale.demo';

/** Fill in demo defaults so each entry below stays readable. */
function club(c) {
  return {
    slug: c.slug,
    name: c.name,
    acronym: c.acronym ?? null,
    category: c.category,
    subcategory: c.subcategory ?? null,
    tagline: c.tagline ?? null,
    description: c.description,
    founded_year: c.founded ?? null,
    website: c.website ?? null,
    contact_email: `${c.slug}@${DEMO_DOMAIN}`,
    instagram: c.instagram ?? `@${c.slug.replace(/-/g, '')}`,
    meeting_day: c.day ?? null,
    meeting_time: c.time ?? null,
    meeting_location: c.where ?? null,
    application_required: c.apply ? 1 : 0,
    applications_open: c.apply ? (c.closed ? 0 : 1) : 0,
    application_deadline: c.apply && !c.closed ? c.deadline ?? '2026-09-18' : null,
    accepting_members: c.full ? 0 : 1,
    size_estimate: c.size ?? 30,
    commitment_hours: c.hours ?? 3,
    selectivity: c.sel ?? (c.apply ? 3.5 : 1),
    rating: c.rating ?? 4.2,
    logo_hue: c.hue ?? 212,
  };
}

const CLUBS = [
  // ==================================================================
  // PUBLICATIONS & MEDIA
  // ==================================================================
  club({
    slug: 'yale-daily-news', name: 'Yale Daily News', acronym: 'YDN',
    category: 'Publications & Media', subcategory: 'Newspaper', founded: 1878,
    tagline: 'The Oldest College Daily',
    description:
      'Founded in 1878, the Yale Daily News is the oldest college daily newspaper in the United States. It is financially and editorially independent of the University, publishing news, opinion, sports, arts and culture coverage of Yale and New Haven. Staff work in desks — University, City, Sci-Tech, Arts, Sports, Opinion, Magazine, Photo, Design, Podcast and Data — and new reporters join through a semesterly bureau program rather than needing prior experience.',
    day: 'Sunday', time: '7:00 PM', where: '202 York Street', apply: true,
    size: 300, hours: 12, sel: 3.0, rating: 4.4, hue: 220, deadline: '2026-09-12',
  }),
  club({
    slug: 'yale-herald', name: 'The Yale Herald',
    category: 'Publications & Media', subcategory: 'Magazine', founded: 1986,
    tagline: 'Weekly campus culture and criticism',
    description:
      'A weekly student publication founded in 1986, the Herald covers campus culture, criticism, personal essay and reported features in a looser, more voice-driven register than a daily paper. Sections include Culture, Features, Opinion, Voices and Inserts, and the Herald is known for giving writers unusual latitude in form.',
    day: 'Tuesday', time: '8:30 PM', where: 'Bass Library L01', apply: true,
    size: 90, hours: 6, sel: 2.5, rating: 4.3, hue: 350,
  }),
  club({
    slug: 'the-new-journal', name: 'The New Journal',
    category: 'Publications & Media', subcategory: 'Magazine', founded: 1967,
    tagline: 'Long-form narrative journalism about Yale and New Haven',
    description:
      'Founded in 1967, The New Journal publishes long-form narrative journalism, essays and profiles about Yale and the city of New Haven. Pieces are reported over an entire semester and edited intensively; the magazine has a strong house tradition of literary nonfiction and has launched a long list of professional journalists.',
    day: 'Wednesday', time: '8:00 PM', where: 'Humanities Quadrangle 136', apply: true,
    size: 45, hours: 7, sel: 3.5, rating: 4.5, hue: 20,
  }),
  club({
    slug: 'yale-record', name: 'The Yale Record',
    category: 'Publications & Media', subcategory: 'Humor', founded: 1872,
    tagline: 'The oldest college humor magazine in the United States',
    description:
      'Established in 1872, The Yale Record is the oldest college humor magazine in the country. It publishes satirical articles, cartoons, fake advertisements and elaborate parody issues, and has historically served as a pipeline into professional comedy writing. New members join through an open comp with pitch meetings; no prior comedy experience is expected.',
    day: 'Thursday', time: '9:00 PM', where: 'Welch Hall Basement', apply: true,
    size: 70, hours: 5, sel: 2.8, rating: 4.6, hue: 45,
  }),
  club({
    slug: 'yale-scientific-magazine', name: 'Yale Scientific Magazine', acronym: 'YSM',
    category: 'Publications & Media', subcategory: 'Science Writing', founded: 1894,
    tagline: 'The nation’s oldest college science publication',
    description:
      'Founded in 1894, Yale Scientific Magazine is the oldest college science publication in the United States. It translates research happening across Yale’s labs into writing a general audience can follow, and runs Articles, Features, Q&A, Design, Copy and Web teams. It also organizes science outreach programming for New Haven schools.',
    day: 'Monday', time: '8:00 PM', where: 'Dunham Lab 220', apply: false,
    size: 110, hours: 4, rating: 4.3, hue: 190,
  }),
  club({
    slug: 'yale-literary-magazine', name: 'The Yale Literary Magazine', acronym: 'The Lit',
    category: 'Publications & Media', subcategory: 'Literary', founded: 1836,
    tagline: 'The oldest literary review in the United States',
    description:
      'Founded in 1836, The Yale Literary Magazine is the oldest literary review in the country and remains a student-run home for undergraduate poetry, fiction, essay and visual art. Submissions are read blind by a rotating editorial board, and the magazine publishes print issues each semester.',
    day: 'Sunday', time: '4:00 PM', where: 'Linsly-Chittenden 211', apply: true,
    size: 35, hours: 4, sel: 3.8, rating: 4.4, hue: 275,
  }),
  club({
    slug: 'the-politic', name: 'The Politic',
    category: 'Publications & Media', subcategory: 'Politics', founded: 1947,
    tagline: 'Yale’s undergraduate journal of politics and policy',
    description:
      'The Politic publishes political analysis, policy writing and long-form interviews with public figures — legislators, ambassadors, activists and academics. Its interview program is the best-known part of the operation; writers pitch and secure their own subjects with editorial support.',
    day: 'Tuesday', time: '7:30 PM', where: 'Rosenkranz Hall 202', apply: false,
    size: 85, hours: 4, rating: 4.2, hue: 232,
  }),
  club({
    slug: 'wybc-yale-radio', name: 'WYBC Yale Radio', acronym: 'WYBC',
    category: 'Publications & Media', subcategory: 'Radio', founded: 1941,
    tagline: 'Student radio since 1941',
    description:
      'WYBC has been Yale’s student radio station since 1941. Undergraduates host their own shows across music, talk, sports and interview formats, run the station’s digital stream, and manage engineering and programming. Anyone can pitch a show; training on the board is provided at the start of each semester.',
    day: 'Wednesday', time: '9:00 PM', where: '165 Elm Street', apply: false,
    size: 120, hours: 3, rating: 4.5, hue: 300,
  }),
  club({
    slug: 'down-magazine', name: 'Down Magazine',
    category: 'Publications & Media', subcategory: 'Magazine',
    tagline: 'Fashion, culture and Black student life at Yale',
    description:
      'Down Magazine is a student publication centering Black student life at Yale through fashion editorial, photography, cultural criticism and profiles. It runs photo shoots, styling and creative direction teams alongside its writing staff.',
    day: 'Thursday', time: '8:00 PM', where: 'Afro-American Cultural Center', apply: false,
    size: 60, hours: 4, rating: 4.6, hue: 12,
  }),
  club({
    slug: 'broad-recognition', name: 'Broad Recognition',
    category: 'Publications & Media', subcategory: 'Magazine',
    tagline: 'A feminist publication at Yale',
    description:
      'Broad Recognition is Yale’s feminist magazine, publishing reporting, essays and art on gender, sexuality, power and campus politics. It runs open pitch meetings and welcomes first-time writers.',
    day: 'Monday', time: '7:00 PM', where: 'Yale Women’s Center', apply: false,
    size: 40, hours: 3, rating: 4.3, hue: 322,
  }),
  club({
    slug: 'yale-historical-review', name: 'The Yale Historical Review', acronym: 'YHR',
    category: 'Publications & Media', subcategory: 'Academic Journal',
    tagline: 'Undergraduate historical scholarship',
    description:
      'The Yale Historical Review publishes outstanding undergraduate historical research from Yale and peer institutions, pairing each accepted paper with a student editor for a full revision cycle. It also runs interviews with historians and a review section.',
    day: 'Sunday', time: '6:00 PM', where: 'Humanities Quadrangle 309', apply: false,
    size: 35, hours: 3, rating: 4.1, hue: 30,
  }),
  club({
    slug: 'yale-global-health-review', name: 'Yale Global Health Review', acronym: 'YGHR',
    category: 'Publications & Media', subcategory: 'Academic Journal',
    tagline: 'Undergraduate writing on global health',
    description:
      'The Yale Global Health Review publishes undergraduate reporting, research summaries and interviews on global and public health — epidemiology, health policy, access to care and the politics of medicine. Writers work with editors across a semester-long production cycle.',
    day: 'Tuesday', time: '8:00 PM', where: 'Laboratory of Epidemiology 101', apply: false,
    size: 45, hours: 3, rating: 4.0, hue: 168,
  }),
  club({
    slug: 'yale-economic-review', name: 'The Yale Economic Review', acronym: 'YER',
    category: 'Publications & Media', subcategory: 'Academic Journal',
    tagline: 'Undergraduate economics writing and interviews',
    description:
      'The Yale Economic Review publishes accessible undergraduate writing on economics and economic policy, including interviews with academics and practitioners. It is a good entry point for students who want to write seriously about markets, development or public finance.',
    day: 'Wednesday', time: '7:00 PM', where: '28 Hillhouse Avenue', apply: false,
    size: 40, hours: 3, rating: 4.0, hue: 140,
  }),
  club({
    slug: 'yale-undergraduate-research-journal', name: 'Yale Undergraduate Research Journal', acronym: 'YURJ',
    category: 'Publications & Media', subcategory: 'Academic Journal',
    tagline: 'Peer-reviewed publishing for undergraduate research',
    description:
      'YURJ gives Yale undergraduates a peer-reviewed venue to publish original research across the sciences, social sciences and humanities. Student editors run the review process and work with authors on revisions; serving as a reviewer is itself a good way to learn how academic publishing works.',
    day: 'Sunday', time: '5:00 PM', where: 'Kline Tower 210', apply: false,
    size: 50, hours: 3, rating: 4.1, hue: 258,
  }),

  // ==================================================================
  // MUSIC & A CAPPELLA
  // ==================================================================
  club({
    slug: 'whiffenpoofs', name: 'The Whiffenpoofs of Yale', acronym: 'Whiffs',
    category: 'Music & A Cappella', subcategory: 'Senior A Cappella', founded: 1909,
    tagline: 'The oldest collegiate a cappella group in the United States',
    description:
      'Founded in 1909, the Whiffenpoofs are the oldest collegiate a cappella group in the country. The group is composed entirely of seniors selected each spring, tours internationally over the year, and performs standards from the Great American Songbook alongside contemporary arrangements. Membership is a full-year commitment including a world tour.',
    day: 'Daily', time: '9:00 PM', where: 'Sprague Memorial Hall', apply: true,
    size: 14, hours: 20, sel: 5.0, rating: 4.8, hue: 220, deadline: '2027-03-06',
  }),
  club({
    slug: 'whim-n-rhythm', name: 'Whim ’n Rhythm', acronym: 'Whim',
    category: 'Music & A Cappella', subcategory: 'Senior A Cappella', founded: 1981,
    tagline: 'Yale’s senior treble a cappella group',
    description:
      'Founded in 1981, Whim ’n Rhythm is Yale’s senior treble a cappella group, selected each spring from the rising senior class. Like the Whiffenpoofs, the group tours internationally and performs a repertoire spanning jazz standards, folk and contemporary arrangements.',
    day: 'Daily', time: '9:00 PM', where: 'Sprague Memorial Hall', apply: true,
    size: 14, hours: 20, sel: 5.0, rating: 4.8, hue: 330, deadline: '2027-03-06',
  }),
  club({
    slug: 'spizzwinks', name: 'The Spizzwinks(?)',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1914,
    tagline: 'The oldest underclassman a cappella group in the country',
    description:
      'Founded in 1914, the Spizzwinks(?) are the oldest underclassman a cappella group in the United States. The group is known for a comedic stage presence, close-harmony arrangements and an annual tour. The question mark is part of the name.',
    day: 'Tuesday', time: '9:30 PM', where: 'William L. Harkness Hall 116', apply: true,
    size: 15, hours: 12, sel: 4.6, rating: 4.7, hue: 205, deadline: '2026-09-14',
  }),
  club({
    slug: 'society-of-orpheus-and-bacchus', name: 'The Society of Orpheus and Bacchus', acronym: 'SOBs',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1938,
    tagline: 'Close harmony since 1938',
    description:
      'The Society of Orpheus and Bacchus, founded in 1938, is one of Yale’s oldest a cappella groups. The SOBs perform a mix of classic close-harmony arrangements and contemporary pop, tour during breaks, and are a fixture of the fall rush concert circuit.',
    day: 'Wednesday', time: '9:30 PM', where: 'Trumbull College', apply: true,
    size: 15, hours: 12, sel: 4.4, rating: 4.6, hue: 268,
  }),
  club({
    slug: 'yale-alley-cats', name: 'The Yale Alley Cats',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1943,
    tagline: 'Jazz-inflected a cappella since 1943',
    description:
      'Founded in 1943, the Alley Cats are known for jazz-leaning arrangements, tight blend and an extensive international touring history. The group performs across campus throughout the year and records regularly.',
    day: 'Monday', time: '9:30 PM', where: 'Berkeley College Common Room', apply: true,
    size: 14, hours: 12, sel: 4.4, rating: 4.6, hue: 42,
  }),
  club({
    slug: 'bakers-dozen', name: 'The Baker’s Dozen',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1947,
    tagline: 'Thirteen singers, no instruments',
    description:
      'Founded in 1947, the Baker’s Dozen is one of Yale’s longest-running a cappella groups, known for jazz standards, doo-wop and contemporary arrangements delivered with a comic edge. The group tours internationally each year.',
    day: 'Thursday', time: '9:30 PM', where: 'Davenport College', apply: true,
    size: 13, hours: 12, sel: 4.5, rating: 4.7, hue: 355,
  }),
  club({
    slug: 'dukes-men-of-yale', name: 'The Duke’s Men of Yale',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1952,
    tagline: 'Founded 1952',
    description:
      'The Duke’s Men of Yale, founded in 1952, perform a broad repertoire from jazz standards to modern pop, with an emphasis on comedy and audience interaction in live shows. The group records albums and tours during academic breaks.',
    day: 'Tuesday', time: '9:00 PM', where: 'Saybrook College', apply: true,
    size: 14, hours: 12, sel: 4.3, rating: 4.6, hue: 200,
  }),
  club({
    slug: 'new-blue', name: 'The New Blue of Yale',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1969,
    tagline: 'Yale’s oldest treble a cappella group',
    description:
      'Founded in 1969, The New Blue is Yale’s oldest treble a cappella group. The ensemble sings a wide repertoire from jazz and folk to contemporary pop, performs at campus and alumni events, and tours during breaks.',
    day: 'Monday', time: '9:00 PM', where: 'Pierson College', apply: true,
    size: 16, hours: 11, sel: 4.2, rating: 4.6, hue: 195,
  }),
  club({
    slug: 'redhot-and-blue', name: 'Redhot & Blue',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1977,
    tagline: 'Yale’s oldest co-ed a cappella group',
    description:
      'Founded in 1977, Redhot & Blue was Yale’s first co-ed a cappella group. The group is known for jazz-rooted arrangements and a warm, blended sound, and performs regularly on campus and on tour.',
    day: 'Wednesday', time: '9:00 PM', where: 'Branford College', apply: true,
    size: 16, hours: 11, sel: 4.2, rating: 4.6, hue: 358,
  }),
  club({
    slug: 'mixed-company-of-yale', name: 'Mixed Company of Yale',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1981,
    tagline: 'Co-ed a cappella since 1981',
    description:
      'Mixed Company is a co-ed a cappella group founded in 1981, performing contemporary pop, rock and R&B arrangements written largely in-house. The group tours internationally and hosts an annual jam concert.',
    day: 'Thursday', time: '9:00 PM', where: 'Ezra Stiles College', apply: true,
    size: 16, hours: 11, sel: 4.1, rating: 4.5, hue: 288,
  }),
  club({
    slug: 'something-extra', name: 'Something Extra',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Co-ed contemporary a cappella',
    description:
      'Something Extra is a co-ed a cappella group performing contemporary pop and R&B with student-written arrangements. The group performs at campus events throughout the year and records original arrangements.',
    day: 'Tuesday', time: '10:00 PM', where: 'Timothy Dwight College', apply: true,
    size: 15, hours: 10, sel: 4.0, rating: 4.5, hue: 178,
  }),
  club({
    slug: 'out-of-the-blue', name: 'Out of the Blue',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Co-ed a cappella with a comedic streak',
    description:
      'Out of the Blue is a co-ed a cappella group known for high-energy contemporary sets and comedy bits woven into performances. It performs across campus and tours during academic breaks.',
    day: 'Wednesday', time: '10:00 PM', where: 'Silliman College', apply: true,
    size: 15, hours: 10, sel: 4.0, rating: 4.5, hue: 210,
  }),
  club({
    slug: 'shades-of-yale', name: 'Shades of Yale', acronym: 'Shades',
    category: 'Music & A Cappella', subcategory: 'A Cappella', founded: 1988,
    tagline: 'Music of the African diaspora',
    description:
      'Founded in 1988, Shades of Yale performs music of the African diaspora — gospel, spirituals, R&B, soul, jazz and Afrobeat — and is one of the most visible musical groups on campus. Shades performs at cultural center events, university ceremonies and its own concerts, and tours regularly.',
    day: 'Sunday', time: '7:00 PM', where: 'Afro-American Cultural Center', apply: true,
    size: 30, hours: 10, sel: 3.8, rating: 4.8, hue: 28,
  }),
  club({
    slug: 'magevet', name: 'Magevet',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Yale’s Jewish a cappella group',
    description:
      'Magevet is Yale’s Jewish a cappella group, performing music in Hebrew, Yiddish, Ladino and English — liturgical settings, Israeli pop and original arrangements. The group performs at Slifka Center events, campus concerts and on tour.',
    day: 'Sunday', time: '8:00 PM', where: 'Slifka Center', apply: true,
    size: 18, hours: 8, sel: 3.4, rating: 4.6, hue: 215,
  }),
  club({
    slug: 'living-water', name: 'Living Water',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Christian a cappella at Yale',
    description:
      'Living Water is Yale’s Christian a cappella group, performing contemporary worship, gospel and hymn arrangements at campus services, concerts and community events. Auditions are held at the start of the fall term.',
    day: 'Friday', time: '7:00 PM', where: 'Dwight Hall Chapel', apply: true,
    size: 18, hours: 7, sel: 3.0, rating: 4.5, hue: 158,
  }),
  club({
    slug: 'proof-of-the-pudding', name: 'Proof of the Pudding',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Treble a cappella',
    description:
      'Proof of the Pudding is a treble a cappella group at Yale performing contemporary pop, indie and jazz arrangements. The group holds fall auditions and performs throughout the year on campus and on tour.',
    day: 'Monday', time: '10:00 PM', where: 'Jonathan Edwards College', apply: true,
    size: 15, hours: 10, sel: 4.0, rating: 4.5, hue: 340,
  }),
  club({
    slug: 'doox-of-yale', name: 'The Doox of Yale',
    category: 'Music & A Cappella', subcategory: 'A Cappella',
    tagline: 'Contemporary a cappella',
    description:
      'The Doox of Yale perform contemporary a cappella with student-arranged pop, rock and R&B, and are known for a theatrical, high-energy live show. The group holds auditions each fall and tours during breaks.',
    day: 'Thursday', time: '10:00 PM', where: 'Morse College', apply: true,
    size: 15, hours: 10, sel: 4.0, rating: 4.4, hue: 250,
  }),
  club({
    slug: 'yale-glee-club', name: 'Yale Glee Club',
    category: 'Music & A Cappella', subcategory: 'Choral', founded: 1861,
    tagline: 'Yale’s principal undergraduate mixed chorus',
    description:
      'Founded in 1861, the Yale Glee Club is the University’s principal undergraduate mixed chorus and one of the oldest collegiate choruses in the country. It performs major choral repertoire, commissions new work, and tours domestically and internationally. Auditions are held at the start of each academic year.',
    day: 'Tuesday', time: '7:00 PM', where: 'Hendrie Hall', apply: true,
    size: 90, hours: 8, sel: 3.6, rating: 4.7, hue: 222,
  }),
  club({
    slug: 'yale-symphony-orchestra', name: 'Yale Symphony Orchestra', acronym: 'YSO',
    category: 'Music & A Cappella', subcategory: 'Orchestra', founded: 1965,
    tagline: 'Yale’s undergraduate orchestra',
    description:
      'Founded in 1965, the Yale Symphony Orchestra is the University’s undergraduate orchestra, performing symphonic repertoire in Woolsey Hall. It is best known for its Halloween Show, an all-night student-produced silent film with live orchestral score that has become a Yale institution.',
    day: 'Monday', time: '7:30 PM', where: 'Woolsey Hall', apply: true,
    size: 100, hours: 9, sel: 4.0, rating: 4.7, hue: 228,
  }),
  club({
    slug: 'davenport-pops-orchestra', name: 'Davenport Pops Orchestra', acronym: 'DPops',
    category: 'Music & A Cappella', subcategory: 'Orchestra',
    tagline: 'No auditions, all arrangements written by members',
    description:
      'DPops is a non-auditioned orchestra that plays film scores, video game music, pop and Broadway — almost entirely in arrangements written by its own members. Anyone who plays an orchestral instrument can join, which makes it one of the most accessible instrumental groups on campus.',
    day: 'Sunday', time: '3:00 PM', where: 'Davenport College Dining Hall', apply: false,
    size: 65, hours: 4, rating: 4.7, hue: 100,
  }),
  club({
    slug: 'yale-precision-marching-band', name: 'Yale Precision Marching Band', acronym: 'YPMB',
    category: 'Music & A Cappella', subcategory: 'Band',
    tagline: 'Yale’s scramble band',
    description:
      'The YPMB is Yale’s scramble band — it plays at football and hockey games, delivers scripted comedic halftime shows, and travels to away games including The Game. No audition is required and instruments can be borrowed; a substantial share of the band learns its instrument after joining.',
    day: 'Wednesday', time: '7:00 PM', where: 'Hendrie Hall Band Room', apply: false,
    size: 90, hours: 6, rating: 4.8, hue: 218,
  }),
  club({
    slug: 'yale-concert-band', name: 'Yale Concert Band', acronym: 'YCB',
    category: 'Music & A Cappella', subcategory: 'Band',
    tagline: 'Wind ensemble repertoire',
    description:
      'The Yale Concert Band performs symphonic wind repertoire, including commissioned new work, in concerts throughout the year and on tour. Membership is open to Yale students by placement audition.',
    day: 'Thursday', time: '7:30 PM', where: 'Hendrie Hall', apply: true,
    size: 70, hours: 6, sel: 2.8, rating: 4.4, hue: 236,
  }),
  club({
    slug: 'opera-theatre-of-yale-college', name: 'Opera Theatre of Yale College', acronym: 'OTYC',
    category: 'Music & A Cappella', subcategory: 'Opera',
    tagline: 'Fully student-produced opera',
    description:
      'OTYC mounts fully student-produced opera at Yale — singers, orchestra, conductor, direction, design and production are all undergraduates. Each season includes a mainstage production and smaller scenes programs, with roles cast by audition and production positions open to anyone.',
    day: 'Sunday', time: '2:00 PM', where: 'Off-Broadway Theater', apply: true,
    size: 55, hours: 10, sel: 3.5, rating: 4.5, hue: 316,
  }),

  // ==================================================================
  // PERFORMING ARTS
  // ==================================================================
  club({
    slug: 'yale-dramatic-association', name: 'Yale Dramatic Association', acronym: 'The Dramat',
    category: 'Performing Arts', subcategory: 'Theater', founded: 1900,
    tagline: 'The second-oldest collegiate theater association in the country',
    description:
      'Founded in 1900, the Yale Dramatic Association is the second-oldest collegiate theater association in the United States. The Dramat produces a full season each year — a Commencement musical, a Fall Mainstage directed by a visiting professional, an Experimental production and a Spring Ex — with undergraduates handling acting, directing, design, tech and production management. Membership is open; production roles are cast and hired per show.',
    day: 'Sunday', time: '6:00 PM', where: 'University Theatre, 222 York St', apply: true,
    size: 200, hours: 12, sel: 3.4, rating: 4.6, hue: 348,
  }),
  club({
    slug: 'purple-crayon', name: 'The Purple Crayon of Yale',
    category: 'Performing Arts', subcategory: 'Improv Comedy', founded: 1985,
    tagline: 'Yale’s oldest improv comedy troupe',
    description:
      'Founded in 1985, the Purple Crayon is Yale’s oldest improvisational comedy troupe. It performs long-form improv in regular campus shows, tours to college improv festivals, and runs workshops open to students who want to try improv without joining.',
    day: 'Tuesday', time: '8:00 PM', where: 'Off-Broadway Theater', apply: true,
    size: 12, hours: 8, sel: 4.5, rating: 4.7, hue: 280,
  }),
  club({
    slug: 'exit-players', name: 'The Exit Players',
    category: 'Performing Arts', subcategory: 'Improv Comedy',
    tagline: 'Long-form and short-form improv',
    description:
      'The Exit Players are a Yale improv troupe performing both long-form and game-based short-form comedy. The group holds auditions each fall, performs monthly on campus, and travels to intercollegiate improv festivals.',
    day: 'Wednesday', time: '8:00 PM', where: 'Trumbull College Underground', apply: true,
    size: 12, hours: 7, sel: 4.4, rating: 4.6, hue: 8,
  }),
  club({
    slug: 'viola-question', name: 'The Viola Question',
    category: 'Performing Arts', subcategory: 'Improv Comedy',
    tagline: 'Improv comedy at Yale',
    description:
      'The Viola Question is a Yale improv comedy troupe performing long-form sets in campus venues throughout the year, with fall auditions and regular open workshops.',
    day: 'Monday', time: '8:00 PM', where: 'Bingham Hall Basement', apply: true,
    size: 11, hours: 7, sel: 4.3, rating: 4.5, hue: 262,
  }),
  club({
    slug: 'fifth-humour', name: 'Fifth Humour',
    category: 'Performing Arts', subcategory: 'Sketch Comedy',
    tagline: 'Sketch comedy, written and performed by members',
    description:
      'Fifth Humour is a sketch comedy group at Yale. Members write, cast, rehearse and perform their own sketches in full-length shows each semester, and also produce filmed sketch pieces.',
    day: 'Thursday', time: '8:00 PM', where: 'Linsly-Chittenden 102', apply: true,
    size: 14, hours: 7, sel: 4.2, rating: 4.5, hue: 52,
  }),
  club({
    slug: 'sphincter-troupe', name: 'Sphincter Troupe',
    category: 'Performing Arts', subcategory: 'Sketch Comedy',
    tagline: 'Sketch and character comedy',
    description:
      'Sphincter Troupe is a Yale sketch comedy group producing original written sketches and character work in semesterly stage shows. Auditions are held at the start of the fall term.',
    day: 'Tuesday', time: '9:00 PM', where: 'Off-Broadway Theater', apply: true,
    size: 12, hours: 7, sel: 4.2, rating: 4.4, hue: 88,
  }),
  club({
    slug: 'just-add-water', name: 'Just Add Water', acronym: 'JAW',
    category: 'Performing Arts', subcategory: 'Improv Comedy',
    tagline: 'Improv comedy troupe',
    description:
      'Just Add Water is a Yale improv comedy troupe performing long-form improvised sets. The group auditions in the fall and performs regularly across campus venues.',
    day: 'Wednesday', time: '9:00 PM', where: 'Silliman Underground', apply: true,
    size: 11, hours: 7, sel: 4.2, rating: 4.4, hue: 186,
  }),
  club({
    slug: 'yaledancers', name: 'Yaledancers',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'Yale’s longest-running student dance company',
    description:
      'Yaledancers is one of Yale’s longest-running student dance companies, presenting fully student-choreographed concerts each semester across modern, jazz, contemporary and ballet idioms. Members both dance and choreograph, and the company mounts a large mainstage show each term.',
    day: 'Sunday', time: '4:00 PM', where: 'Payne Whitney Gym, Dance Studio', apply: true,
    size: 40, hours: 8, sel: 3.6, rating: 4.6, hue: 306,
  }),
  club({
    slug: 'rhythmic-blue', name: 'Rhythmic Blue',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'Hip-hop and street styles',
    description:
      'Rhythmic Blue is Yale’s hip-hop dance company, performing choreography rooted in street styles — hip-hop, house, popping and dancehall — at campus showcases, cultural center events and intercollegiate competitions.',
    day: 'Monday', time: '9:00 PM', where: 'Payne Whitney Gym, Dance Studio', apply: true,
    size: 30, hours: 8, sel: 3.8, rating: 4.7, hue: 16,
  }),
  club({
    slug: 'danceworks', name: 'Danceworks',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'Student choreography, no experience required',
    description:
      'Danceworks is a non-auditioned dance company: any student can choreograph a piece and any student can dance in one. It produces a large end-of-semester showcase spanning contemporary, jazz, tap, ballet and hip-hop, and is the usual on-ramp for students who danced in high school and want to keep going without a competitive audition.',
    day: 'Saturday', time: '1:00 PM', where: 'Payne Whitney Gym, Dance Studio', apply: false,
    size: 120, hours: 4, rating: 4.6, hue: 196,
  }),
  club({
    slug: 'a-different-drum', name: 'A Different Drum Dance Company',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'Contemporary and modern dance',
    description:
      'A Different Drum is a student dance company performing contemporary and modern choreography created by its members, with semesterly concerts and collaborative pieces with other campus arts groups.',
    day: 'Tuesday', time: '9:00 PM', where: 'Payne Whitney Gym, Studio B', apply: true,
    size: 25, hours: 7, sel: 3.4, rating: 4.4, hue: 244,
  }),
  club({
    slug: 'yale-ballroom-dance-team', name: 'Yale Ballroom Dance Team',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'Standard and Latin ballroom, beginners welcome',
    description:
      'The Yale Ballroom Dance Team trains and competes in International Standard and Latin as well as American Smooth and Rhythm. Complete beginners are welcomed and taught from scratch each fall, and the team travels to collegiate competitions across the Northeast.',
    day: 'Sunday', time: '5:00 PM', where: 'Payne Whitney Gym, Lanman Center', apply: false,
    size: 70, hours: 5, rating: 4.6, hue: 336,
  }),
  club({
    slug: 'alliance-for-dance-at-yale', name: 'Alliance for Dance at Yale', acronym: 'ADY',
    category: 'Performing Arts', subcategory: 'Dance',
    tagline: 'The umbrella body for Yale dance groups',
    description:
      'ADY coordinates Yale’s undergraduate dance community — sharing rehearsal space, running joint showcases, distributing funding and organizing the annual campus-wide dance festival. Representatives from member companies meet regularly.',
    day: 'Sunday', time: '8:00 PM', where: 'Off-Broadway Theater Lobby', apply: false,
    size: 45, hours: 2, rating: 4.2, hue: 292,
  }),

  // ==================================================================
  // POLITICAL & ADVOCACY
  // ==================================================================
  club({
    slug: 'yale-political-union', name: 'Yale Political Union', acronym: 'YPU',
    category: 'Political & Advocacy', subcategory: 'Debate', founded: 1934,
    tagline: 'Parliamentary debate with guest speakers, since 1934',
    description:
      'Founded in 1934, the Yale Political Union is the largest undergraduate debating society in the country. It holds weekly floor debates that open with an invited guest — politicians, journalists, academics and activists — followed by student speeches from the floor and a recorded vote. Members belong to ideological parties that caucus separately before each debate.',
    day: 'Tuesday', time: '7:30 PM', where: 'Sheffield-Sterling-Strathcona Hall 114', apply: false,
    size: 350, hours: 5, rating: 4.4, hue: 226,
  }),
  club({
    slug: 'party-of-the-left', name: 'Party of the Left', acronym: 'POL',
    category: 'Political & Advocacy', subcategory: 'YPU Party',
    tagline: 'A left political party of the Yale Political Union',
    description:
      'The Party of the Left is one of the ideological parties of the Yale Political Union. Members caucus weekly to debate resolutions from a left perspective before taking positions on the YPU floor, and the party maintains its own internal debate tradition and social calendar.',
    day: 'Tuesday', time: '5:30 PM', where: 'William L. Harkness Hall 208', apply: false,
    size: 45, hours: 4, rating: 4.3, hue: 356,
  }),
  club({
    slug: 'party-of-the-right', name: 'Party of the Right', acronym: 'POR',
    category: 'Political & Advocacy', subcategory: 'YPU Party', founded: 1953,
    tagline: 'A conservative party of the Yale Political Union',
    description:
      'Founded in 1953, the Party of the Right is one of the oldest and most distinctive parties of the Yale Political Union, known for a philosophically oriented debate style and a strong internal culture of chairs, traditions and lengthy caucus debates.',
    day: 'Tuesday', time: '5:30 PM', where: 'William L. Harkness Hall 201', apply: false,
    size: 40, hours: 4, rating: 4.3, hue: 232,
  }),
  club({
    slug: 'federalist-party', name: 'The Federalist Party',
    category: 'Political & Advocacy', subcategory: 'YPU Party',
    tagline: 'A party of the Yale Political Union',
    description:
      'The Federalist Party is a party of the Yale Political Union with a tradition of institutionalist and constitutionally focused debate. It caucuses weekly ahead of YPU floor debates and hosts its own speaker and social events.',
    day: 'Tuesday', time: '5:30 PM', where: 'Linsly-Chittenden 317', apply: false,
    size: 35, hours: 4, rating: 4.2, hue: 210,
  }),
  club({
    slug: 'tory-party', name: 'The Tory Party',
    category: 'Political & Advocacy', subcategory: 'YPU Party',
    tagline: 'A party of the Yale Political Union',
    description:
      'The Tory Party is a party of the Yale Political Union known for a traditionalist debate style and a formal internal culture. Members caucus weekly and speak on the YPU floor.',
    day: 'Tuesday', time: '5:30 PM', where: 'Linsly-Chittenden 319', apply: false,
    size: 30, hours: 4, rating: 4.2, hue: 268,
  }),
  club({
    slug: 'yale-college-democrats', name: 'Yale College Democrats',
    category: 'Political & Advocacy', subcategory: 'Partisan',
    tagline: 'Campaign work, canvassing and advocacy',
    description:
      'The Yale College Democrats organize campaign volunteering, voter registration drives and canvassing trips in Connecticut and swing districts, and host elected officials and campaign staff on campus. Membership is open and activity level scales with the election calendar.',
    day: 'Wednesday', time: '8:00 PM', where: 'William L. Harkness Hall 119', apply: false,
    size: 200, hours: 4, rating: 4.3, hue: 214,
  }),
  club({
    slug: 'yale-college-republicans', name: 'Yale College Republicans',
    category: 'Political & Advocacy', subcategory: 'Partisan',
    tagline: 'Conservative political organizing on campus',
    description:
      'The Yale College Republicans host speakers, run discussion nights on policy and political philosophy, and organize campaign volunteering in Connecticut races. Membership is open to any undergraduate.',
    day: 'Thursday', time: '8:00 PM', where: 'William L. Harkness Hall 116', apply: false,
    size: 80, hours: 3, rating: 4.1, hue: 4,
  }),
  club({
    slug: 'students-unite-now', name: 'Students Unite Now', acronym: 'SUN',
    category: 'Political & Advocacy', subcategory: 'Campus Advocacy',
    tagline: 'Student organizing on financial aid and accessibility',
    description:
      'Students Unite Now is a student organizing group focused on the financial barriers Yale students face — most prominently the student income contribution and the costs attached to full participation in campus life. SUN runs campaigns, petitions, testimony and direct actions.',
    day: 'Sunday', time: '7:00 PM', where: 'Dwight Hall Common Room', apply: false,
    size: 90, hours: 4, rating: 4.4, hue: 46,
  }),
  club({
    slug: 'yale-student-environmental-coalition', name: 'Yale Student Environmental Coalition', acronym: 'YSEC',
    category: 'Political & Advocacy', subcategory: 'Environment',
    tagline: 'Climate and environmental organizing at Yale',
    description:
      'YSEC coordinates environmental and climate work across campus — sustainability policy advocacy, campaigns on university practices, educational programming and coalition work with New Haven environmental groups.',
    day: 'Monday', time: '7:30 PM', where: 'Kroon Hall 319', apply: false,
    size: 75, hours: 4, rating: 4.3, hue: 148,
  }),
  club({
    slug: 'reproductive-justice-action-league', name: 'Reproductive Justice Action League at Yale', acronym: 'RALY',
    category: 'Political & Advocacy', subcategory: 'Advocacy',
    tagline: 'Reproductive justice education and advocacy',
    description:
      'RALY organizes around reproductive justice — access to care, sex education, policy advocacy in Connecticut, and partnerships with local clinics and organizations. It runs education programming on campus and volunteer opportunities off it.',
    day: 'Tuesday', time: '8:30 PM', where: 'Yale Women’s Center', apply: false,
    size: 55, hours: 3, rating: 4.4, hue: 326,
  }),

  // ==================================================================
  // ACADEMIC & DEBATE
  // ==================================================================
  club({
    slug: 'yale-debate-association', name: 'Yale Debate Association', acronym: 'YDA',
    category: 'Academic & Debate', subcategory: 'Competitive Debate', founded: 1908,
    tagline: 'American Parliamentary and British Parliamentary debate',
    description:
      'The Yale Debate Association competes on the American Parliamentary (APDA) and British Parliamentary circuits, traveling most weekends of the academic year to tournaments across the United States and internationally. It also hosts the Yale Intercollegiate Invitational, one of the largest tournaments on the circuit, and runs novice training for students with no debate background.',
    day: 'Wednesday', time: '7:00 PM', where: 'William L. Harkness Hall 208', apply: false,
    size: 60, hours: 10, rating: 4.5, hue: 220,
  }),
  club({
    slug: 'yale-mock-trial', name: 'Yale Mock Trial Association', acronym: 'YMTA',
    category: 'Academic & Debate', subcategory: 'Competitive',
    tagline: 'Competitive collegiate mock trial',
    description:
      'The Yale Mock Trial Association fields multiple teams on the American Mock Trial Association circuit, arguing a single civil or criminal case all season as attorneys and witnesses. Teams travel to invitationals in the fall and to regional and national championship rounds in the spring. Tryouts are held at the beginning of the fall term.',
    day: 'Sunday', time: '4:00 PM', where: 'Linsly-Chittenden 101', apply: true,
    size: 55, hours: 10, sel: 3.8, rating: 4.5, hue: 342,
  }),
  club({
    slug: 'yale-international-relations-association', name: 'Yale International Relations Association', acronym: 'YIRA',
    category: 'Academic & Debate', subcategory: 'International Affairs',
    tagline: 'Model UN, conferences and international affairs programming',
    description:
      'YIRA is the umbrella organization for international affairs at Yale. It runs the traveling Model United Nations team, hosts several large conferences, and organizes speaker and discussion programming on foreign policy. Its constituent programs include YMUN, YMUN Taiwan, YMUN Korea, SCSY and the Yale Review of International Studies.',
    day: 'Monday', time: '8:00 PM', where: 'Rosenkranz Hall 241', apply: true,
    size: 250, hours: 6, sel: 3.2, rating: 4.4, hue: 204,
  }),
  club({
    slug: 'yale-model-united-nations', name: 'Yale Model United Nations', acronym: 'YMUN',
    category: 'Academic & Debate', subcategory: 'Model UN', founded: 1974,
    tagline: 'One of the largest high school Model UN conferences in the world',
    description:
      'YMUN is a conference run entirely by Yale undergraduates for well over a thousand high school delegates each January in New Haven. Staff write committee topic guides, chair debate, run crisis committees and manage operations, logistics and delegate experience for the weekend.',
    day: 'Sunday', time: '7:00 PM', where: 'Rosenkranz Hall 002', apply: true,
    size: 200, hours: 6, sel: 3.0, rating: 4.5, hue: 198,
  }),
  club({
    slug: 'yale-undergraduate-mathematics-society', name: 'Yale Undergraduate Mathematics Society', acronym: 'YUMS',
    category: 'Academic & Debate', subcategory: 'Mathematics',
    tagline: 'Talks, problem sessions and the Putnam',
    description:
      'YUMS runs undergraduate math talks, problem-solving sessions, Putnam Competition preparation and social events for students interested in mathematics. Meetings are open to anyone regardless of coursework level.',
    day: 'Thursday', time: '5:00 PM', where: 'Kline Tower 12th Floor Lounge', apply: false,
    size: 60, hours: 2, rating: 4.2, hue: 264,
  }),

  // ==================================================================
  // PRE-PROFESSIONAL
  // ==================================================================
  club({
    slug: 'yale-undergraduate-consulting-group', name: 'Yale Undergraduate Consulting Group', acronym: 'YUCG',
    category: 'Pre-Professional', subcategory: 'Consulting',
    tagline: 'Pro-bono consulting for real clients',
    description:
      'YUCG places undergraduate teams on semester-long pro-bono consulting engagements with startups, nonprofits and New Haven businesses. Members are trained in case structuring, market sizing, client communication and deliverable design, and present final recommendations to the client. Recruiting happens each fall through applications and case interviews.',
    day: 'Sunday', time: '6:00 PM', where: 'Evans Hall 2400', apply: true,
    size: 80, hours: 7, sel: 4.5, rating: 4.4, hue: 208, deadline: '2026-09-15',
  }),
  club({
    slug: 'yale-undergraduate-diversified-investments', name: 'Yale Undergraduate Diversified Investments', acronym: 'YUDI',
    category: 'Pre-Professional', subcategory: 'Finance',
    tagline: 'A student-managed investment fund',
    description:
      'YUDI is a student-run investment organization in which members research securities, pitch positions to the group and manage a real portfolio across sectors. It runs an education program each fall covering valuation, financial statement analysis and pitch construction.',
    day: 'Tuesday', time: '8:00 PM', where: 'Evans Hall 2410', apply: true,
    size: 55, hours: 6, sel: 4.3, rating: 4.3, hue: 156,
  }),
  club({
    slug: 'smart-woman-securities', name: 'Smart Woman Securities', acronym: 'SWS',
    category: 'Pre-Professional', subcategory: 'Finance',
    tagline: 'Investing education for women undergraduates',
    description:
      'The Yale chapter of Smart Woman Securities runs a semester-long seminar on value investing and financial literacy for women undergraduates, followed by a stock pitch competition judged by investment professionals. No prior finance background is expected.',
    day: 'Monday', time: '7:00 PM', where: 'Evans Hall 4200', apply: false,
    size: 70, hours: 4, rating: 4.4, hue: 320,
  }),
  club({
    slug: 'yale-entrepreneurial-society', name: 'Yale Entrepreneurial Society', acronym: 'YES',
    category: 'Pre-Professional', subcategory: 'Entrepreneurship',
    tagline: 'Building companies from campus',
    description:
      'YES supports student founders with workshops, mentorship, pitch events and connections to the New Haven startup ecosystem and Yale’s entrepreneurship programs. It runs founder office hours, a startup fair and an annual pitch competition.',
    day: 'Wednesday', time: '7:30 PM', where: 'Tsai CITY, 17 Prospect St', apply: false,
    size: 150, hours: 3, rating: 4.2, hue: 36,
  }),

  // ==================================================================
  // STEM & ENGINEERING
  // ==================================================================
  club({
    slug: 'yale-undergraduate-aerospace-association', name: 'Yale Undergraduate Aerospace Association', acronym: 'YUAA',
    category: 'STEM & Engineering', subcategory: 'Aerospace',
    tagline: 'Student-led aerospace and engineering projects',
    description:
      'YUAA runs hands-on student engineering project teams — high-powered rockets, high-altitude balloons, drones, satellites and design-build competition entries. Teams are open to students at any experience level and meet weekly in the lab; funding, tools and machine shop access are provided through the organization.',
    day: 'Sunday', time: '2:00 PM', where: 'Center for Engineering Innovation and Design', apply: false,
    size: 120, hours: 6, rating: 4.6, hue: 202,
  }),
  club({
    slug: 'yale-computer-society', name: 'Yale Computer Society', acronym: 'YCS',
    category: 'STEM & Engineering', subcategory: 'Computer Science',
    tagline: 'Software projects, workshops and hackathons',
    description:
      'The Yale Computer Society builds software for the Yale community, runs technical workshops and study jams, and organizes hackathons and speaker events. Its projects have included widely used campus tools; new members join project teams regardless of prior experience.',
    day: 'Thursday', time: '7:00 PM', where: 'Arthur K. Watson Hall 20', apply: false,
    size: 200, hours: 5, rating: 4.5, hue: 250,
  }),
  club({
    slug: 'yhack', name: 'YHack',
    category: 'STEM & Engineering', subcategory: 'Hackathon',
    tagline: 'Yale’s flagship hackathon',
    description:
      'YHack is Yale’s large annual hackathon, drawing hundreds of student participants from across the country for a weekend of building. The organizing team handles sponsorship, logistics, judging, mentorship and the participant experience over the months leading up to the event.',
    day: 'Sunday', time: '8:00 PM', where: 'Arthur K. Watson Hall 60', apply: true,
    size: 45, hours: 6, sel: 3.2, rating: 4.3, hue: 176,
  }),
  club({
    slug: 'society-of-women-engineers-yale', name: 'Society of Women Engineers, Yale', acronym: 'SWE',
    category: 'STEM & Engineering', subcategory: 'Professional',
    tagline: 'Community and professional development in engineering',
    description:
      'The Yale chapter of the Society of Women Engineers runs mentorship pairings, resume and interview workshops, industry panels, outreach to New Haven K-12 students and a social program for women and gender minorities in engineering.',
    day: 'Tuesday', time: '7:00 PM', where: 'Becton Center 102', apply: false,
    size: 110, hours: 3, rating: 4.4, hue: 312,
  }),
  club({
    slug: 'nsbe-yale', name: 'National Society of Black Engineers, Yale Chapter', acronym: 'NSBE',
    category: 'STEM & Engineering', subcategory: 'Professional',
    tagline: 'Academic and professional support in engineering',
    description:
      'The Yale chapter of NSBE supports Black students in engineering and the sciences through study groups, mentorship, the national convention, corporate recruiting connections and STEM outreach in New Haven schools.',
    day: 'Wednesday', time: '7:30 PM', where: 'Dunham Laboratory 220', apply: false,
    size: 65, hours: 3, rating: 4.5, hue: 24,
  }),
  club({
    slug: 'shpe-yale', name: 'Society of Hispanic Professional Engineers, Yale', acronym: 'SHPE',
    category: 'STEM & Engineering', subcategory: 'Professional',
    tagline: 'Hispanic students in engineering and STEM',
    description:
      'SHPE at Yale builds community among Hispanic and Latinx students in engineering and STEM, running professional development programming, the national convention trip, mentorship and community outreach.',
    day: 'Thursday', time: '7:30 PM', where: 'La Casa Cultural', apply: false,
    size: 55, hours: 3, rating: 4.4, hue: 34,
  }),
  club({
    slug: 'engineers-without-borders-yale', name: 'Engineers Without Borders, Yale Chapter', acronym: 'EWB',
    category: 'STEM & Engineering', subcategory: 'Service Engineering',
    tagline: 'Community-partnered engineering projects',
    description:
      'The Yale chapter of Engineers Without Borders designs and implements infrastructure projects — water, sanitation and energy systems — in long-term partnership with communities, alongside local New Haven projects. Members contribute across design, fundraising, project management and travel teams.',
    day: 'Sunday', time: '5:00 PM', where: 'Center for Engineering Innovation and Design', apply: false,
    size: 70, hours: 5, rating: 4.5, hue: 164,
  }),
  club({
    slug: 'yale-igem', name: 'Yale iGEM',
    category: 'STEM & Engineering', subcategory: 'Synthetic Biology',
    tagline: 'Synthetic biology research and international competition',
    description:
      'Yale iGEM is an undergraduate synthetic biology team that designs and executes an original research project over the year and presents it at the international iGEM Giant Jamboree. Members work at the bench, on modeling, and on human-practices and outreach components.',
    day: 'Saturday', time: '10:00 AM', where: 'West Campus, Yale Science Building', apply: true,
    size: 25, hours: 9, sel: 4.2, rating: 4.5, hue: 130,
  }),
  club({
    slug: 'bulldogs-racing', name: 'Bulldogs Racing',
    category: 'STEM & Engineering', subcategory: 'Motorsport',
    tagline: 'Yale’s Formula SAE team',
    description:
      'Bulldogs Racing is Yale’s Formula SAE team, designing, manufacturing and racing a formula-style car each year in international collegiate competition. Subteams cover chassis, powertrain, suspension, electronics, aerodynamics and business, and welcome members with no prior automotive experience.',
    day: 'Saturday', time: '12:00 PM', where: 'CEID Machine Shop', apply: false,
    size: 60, hours: 8, rating: 4.5, hue: 220,
  }),
  club({
    slug: 'yale-splash', name: 'Splash at Yale',
    category: 'STEM & Engineering', subcategory: 'Education Outreach',
    tagline: 'Yale students teach anything to local middle and high schoolers',
    description:
      'Splash is a program in which Yale undergraduates design and teach one-day classes on any subject they like to hundreds of visiting middle and high school students. Anyone can propose a class; the organizing team handles registration, scheduling, logistics and outreach.',
    day: 'Wednesday', time: '8:00 PM', where: 'Dwight Hall Common Room', apply: false,
    size: 90, hours: 3, rating: 4.6, hue: 54,
  }),

  // ==================================================================
  // CULTURAL & IDENTITY
  // ==================================================================
  club({
    slug: 'asian-american-students-alliance', name: 'Asian American Students Alliance', acronym: 'AASA',
    category: 'Cultural & Identity', subcategory: 'Umbrella',
    tagline: 'The umbrella body for Asian American student groups at Yale',
    description:
      'AASA is the umbrella organization for Asian American student groups at Yale, coordinating cultural programming, political advocacy, first-year outreach and the annual Asian American cultural showcase. It works closely with the Asian American Cultural Center.',
    day: 'Sunday', time: '7:00 PM', where: 'Asian American Cultural Center, 295 Crown St', apply: false,
    size: 200, hours: 3, rating: 4.6, hue: 348,
  }),
  club({
    slug: 'black-student-alliance-at-yale', name: 'Black Student Alliance at Yale', acronym: 'BSAY',
    category: 'Cultural & Identity', subcategory: 'Umbrella',
    tagline: 'The representative body for Black students at Yale',
    description:
      'BSAY is the umbrella and representative organization for Black students at Yale. It coordinates cultural, political and social programming, advocates on institutional issues, runs first-year mentorship and organizes major events with the Afro-American Cultural Center.',
    day: 'Sunday', time: '6:00 PM', where: 'Afro-American Cultural Center, 211 Park St', apply: false,
    size: 250, hours: 3, rating: 4.7, hue: 20,
  }),
  club({
    slug: 'la-casa-mecha', name: 'Movimiento Estudiantil Chicanx de Aztlán de Yale', acronym: 'MEChA',
    category: 'Cultural & Identity', subcategory: 'Latinx',
    tagline: 'Chicanx political and cultural organizing',
    description:
      'MEChA de Yale organizes around Chicanx identity, history and politics, running cultural programming, political education, immigration-related advocacy and community work with Latinx organizations in New Haven. It is based out of La Casa Cultural.',
    day: 'Tuesday', time: '8:00 PM', where: 'La Casa Cultural, 301 Crown St', apply: false,
    size: 70, hours: 3, rating: 4.5, hue: 40,
  }),
  club({
    slug: 'despierta-boricua', name: 'Despierta Boricua',
    category: 'Cultural & Identity', subcategory: 'Latinx',
    tagline: 'Puerto Rican students at Yale',
    description:
      'Despierta Boricua is Yale’s Puerto Rican student organization, running cultural celebrations, political education on the status question and Puerto Rican history, hurricane relief fundraising and community events out of La Casa Cultural.',
    day: 'Wednesday', time: '8:00 PM', where: 'La Casa Cultural, 301 Crown St', apply: false,
    size: 55, hours: 3, rating: 4.6, hue: 200,
  }),
  club({
    slug: 'association-of-native-americans-at-yale', name: 'Association of Native Americans at Yale', acronym: 'ANAAY',
    category: 'Cultural & Identity', subcategory: 'Indigenous',
    tagline: 'Native and Indigenous student community',
    description:
      'ANAAY is the primary organization for Native and Indigenous students at Yale, hosting the annual spring powwow, cultural and educational programming, advocacy on Indigenous issues at the University, and community-building out of the Native American Cultural Center.',
    day: 'Thursday', time: '7:00 PM', where: 'Native American Cultural Center, 26 High St', apply: false,
    size: 45, hours: 3, rating: 4.7, hue: 148,
  }),
  club({
    slug: 'yale-african-students-association', name: 'Yale African Students Association', acronym: 'YASA',
    category: 'Cultural & Identity', subcategory: 'African',
    tagline: 'African students and the diaspora at Yale',
    description:
      'YASA brings together students from across the African continent and the diaspora for cultural programming, speaker events, the annual African Cultural Show, and social and professional networking.',
    day: 'Friday', time: '7:00 PM', where: 'Afro-American Cultural Center', apply: false,
    size: 90, hours: 3, rating: 4.7, hue: 100,
  }),
  club({
    slug: 'chinese-american-students-association', name: 'Chinese American Students Association', acronym: 'CASA',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Chinese American community and culture',
    description:
      'CASA organizes cultural, social and political programming for Chinese American students at Yale, including Lunar New Year celebrations, mentorship for first-years, discussion series and collaborations with other AACC groups.',
    day: 'Sunday', time: '8:00 PM', where: 'Asian American Cultural Center', apply: false,
    size: 130, hours: 3, rating: 4.5, hue: 356,
  }),
  club({
    slug: 'korean-american-students-at-yale', name: 'Korean American Students at Yale', acronym: 'KASY',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Korean American student community',
    description:
      'KASY runs cultural programming, food events, first-year mentorship, a large annual culture show and social events for Korean American students and anyone interested in Korean culture at Yale.',
    day: 'Friday', time: '8:00 PM', where: 'Asian American Cultural Center', apply: false,
    size: 120, hours: 3, rating: 4.5, hue: 214,
  }),
  club({
    slug: 'taiwanese-american-society', name: 'Taiwanese American Society', acronym: 'TAS',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Taiwanese American culture and community',
    description:
      'TAS builds community among Taiwanese American students at Yale through night-market events, cultural programming, language and food nights, and collaborations with Taiwanese student groups at other universities.',
    day: 'Saturday', time: '6:00 PM', where: 'Asian American Cultural Center', apply: false,
    size: 70, hours: 2, rating: 4.5, hue: 168,
  }),
  club({
    slug: 'vietnamese-students-association', name: 'Vietnamese Students Association', acronym: 'VSA',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Vietnamese culture and community at Yale',
    description:
      'The Vietnamese Students Association hosts cultural nights, Tet celebrations, food events and mentorship programming, and collaborates with VSAs across the Northeast on regional conferences and competitions.',
    day: 'Thursday', time: '8:00 PM', where: 'Asian American Cultural Center', apply: false,
    size: 60, hours: 2, rating: 4.5, hue: 12,
  }),
  club({
    slug: 'kasama-filipino-club', name: 'Kasama: The Filipino Club at Yale',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Filipino culture, history and community',
    description:
      'Kasama is Yale’s Filipino student organization, running cultural programming, a large annual culture night with traditional dance and music, political education on Philippine history, and community events.',
    day: 'Wednesday', time: '8:00 PM', where: 'Asian American Cultural Center', apply: false,
    size: 55, hours: 3, rating: 4.6, hue: 44,
  }),
  club({
    slug: 'japanese-american-students-union', name: 'Japanese American Students Union', acronym: 'JASU',
    category: 'Cultural & Identity', subcategory: 'Asian American',
    tagline: 'Japanese American community at Yale',
    description:
      'JASU builds community among Japanese American students and others interested in Japanese culture, with food events, cultural programming, history and identity discussions, and intercollegiate collaboration.',
    day: 'Tuesday', time: '7:30 PM', where: 'Asian American Cultural Center', apply: false,
    size: 45, hours: 2, rating: 4.4, hue: 4,
  }),
  club({
    slug: 'south-asian-society', name: 'South Asian Society', acronym: 'SAS',
    category: 'Cultural & Identity', subcategory: 'South Asian',
    tagline: 'South Asian culture and community at Yale',
    description:
      'SAS is Yale’s South Asian cultural organization, hosting Diwali and Holi celebrations, an annual culture show, food and film nights, and first-year mentorship. It works closely with South Asian dance, music and religious groups on campus.',
    day: 'Friday', time: '7:30 PM', where: 'Asian American Cultural Center', apply: false,
    size: 160, hours: 3, rating: 4.6, hue: 30,
  }),
  club({
    slug: 'yale-caribbean-students-organization', name: 'Yale Caribbean Students’ Organization', acronym: 'CSO',
    category: 'Cultural & Identity', subcategory: 'Caribbean',
    tagline: 'Caribbean students and culture',
    description:
      'The Caribbean Students’ Organization brings together students from the Caribbean and its diaspora for cultural programming, carnival and food events, discussion series and community-building.',
    day: 'Saturday', time: '7:00 PM', where: 'Afro-American Cultural Center', apply: false,
    size: 50, hours: 2, rating: 4.6, hue: 172,
  }),
  club({
    slug: 'yale-lgbtq-cooperative', name: 'Yale LGBTQ Cooperative', acronym: 'The Co-op',
    category: 'Cultural & Identity', subcategory: 'LGBTQ',
    tagline: 'The umbrella organization for LGBTQ students at Yale',
    description:
      'The Co-op is the umbrella body for LGBTQ student organizations at Yale, coordinating programming with the Office of LGBTQ Resources, running social and discussion events, and advocating on issues affecting queer and trans students.',
    day: 'Sunday', time: '7:30 PM', where: 'Office of LGBTQ Resources, 135 Prospect St', apply: false,
    size: 140, hours: 2, rating: 4.6, hue: 296,
  }),
  club({
    slug: 'yale-womens-center', name: 'Yale Women’s Center',
    category: 'Cultural & Identity', subcategory: 'Gender',
    tagline: 'A student-run center and organizing space',
    description:
      'The Yale Women’s Center is a student-run space and organization supporting feminist programming, advocacy on gender-based violence and equity, discussion groups, and a physical common space open to all students. Its board is elected by members.',
    day: 'Monday', time: '8:00 PM', where: 'Durfee Hall Basement', apply: false,
    size: 80, hours: 3, rating: 4.5, hue: 330,
  }),

  // ==================================================================
  // RELIGIOUS & SPIRITUAL
  // ==================================================================
  club({
    slug: 'yale-hillel', name: 'Yale Hillel at the Slifka Center',
    category: 'Religious & Spiritual', subcategory: 'Jewish',
    tagline: 'Jewish life at Yale',
    description:
      'Yale Hillel, based at the Joseph Slifka Center for Jewish Life, organizes Shabbat dinners and services across denominations, holiday programming, learning groups, social justice work and social events. Its student board runs most programming.',
    day: 'Friday', time: '6:00 PM', where: 'Slifka Center, 80 Wall St', apply: false,
    size: 300, hours: 3, rating: 4.7, hue: 216,
  }),
  club({
    slug: 'chabad-at-yale', name: 'Chabad at Yale',
    category: 'Religious & Spiritual', subcategory: 'Jewish',
    tagline: 'Shabbat, holidays and Jewish learning',
    description:
      'Chabad at Yale hosts Shabbat and holiday meals, one-on-one and group Torah learning, and social programming for Jewish students of all backgrounds and levels of observance.',
    day: 'Friday', time: '7:30 PM', where: 'Chabad House, 36 Lynwood Pl', apply: false,
    size: 120, hours: 2, rating: 4.7, hue: 226,
  }),
  club({
    slug: 'muslim-students-association', name: 'Muslim Students Association', acronym: 'MSA',
    category: 'Religious & Spiritual', subcategory: 'Muslim',
    tagline: 'Muslim life and community at Yale',
    description:
      'The MSA organizes daily and Friday prayer, Ramadan iftars, halal dining advocacy, educational programming and social events for Muslim students at Yale, working with the University Chaplain’s Office and the Yale Muslim Chaplaincy.',
    day: 'Friday', time: '1:00 PM', where: 'Yale Chaplain’s Office, Bingham Hall', apply: false,
    size: 130, hours: 3, rating: 4.7, hue: 152,
  }),
  club({
    slug: 'saint-thomas-more', name: 'Saint Thomas More Catholic Chapel & Center',
    category: 'Religious & Spiritual', subcategory: 'Catholic',
    tagline: 'Catholic life at Yale',
    description:
      'Saint Thomas More is the Catholic chapel and student center at Yale, offering daily and Sunday Mass, retreats, faith formation groups, service programming and a large student social calendar.',
    day: 'Sunday', time: '5:00 PM', where: '268 Park Street', apply: false,
    size: 200, hours: 3, rating: 4.6, hue: 264,
  }),
  club({
    slug: 'yale-students-for-christ', name: 'Yale Students for Christ',
    category: 'Religious & Spiritual', subcategory: 'Christian',
    tagline: 'Christian fellowship, Bible study and community',
    description:
      'Yale Students for Christ is an interdenominational Christian fellowship offering weekly large-group gatherings, small-group Bible studies, retreats and service opportunities. All students are welcome regardless of background.',
    day: 'Friday', time: '7:00 PM', where: 'Dwight Hall Chapel', apply: false,
    size: 110, hours: 3, rating: 4.6, hue: 190,
  }),

  // ==================================================================
  // COMMUNITY SERVICE
  // ==================================================================
  club({
    slug: 'dwight-hall', name: 'Dwight Hall at Yale',
    category: 'Community Service', subcategory: 'Umbrella', founded: 1886,
    tagline: 'The largest student-run service organization in the country',
    description:
      'Founded in 1886, Dwight Hall is the center for public service and social justice at Yale and one of the largest student-run service organizations in the country. It is an umbrella for scores of member groups, distributes grants and fellowships, and connects students with New Haven community partners.',
    day: 'Sunday', time: '5:00 PM', where: 'Dwight Hall, 67 High St', apply: false,
    size: 400, hours: 4, rating: 4.6, hue: 158,
  }),
  club({
    slug: 'yhhap', name: 'Yale Hunger and Homelessness Action Project', acronym: 'YHHAP',
    category: 'Community Service', subcategory: 'Housing & Food',
    tagline: 'Fighting hunger and homelessness in New Haven',
    description:
      'YHHAP works on hunger and homelessness in New Haven through direct service at shelters and soup kitchens, advocacy, and its long-running Fast — a campus-wide meal-donation drive that funds local organizations. Members can volunteer weekly or work on policy and fundraising teams.',
    day: 'Tuesday', time: '7:00 PM', where: 'Dwight Hall, 67 High St', apply: false,
    size: 130, hours: 4, rating: 4.7, hue: 142,
  }),
  club({
    slug: 'community-health-educators', name: 'Community Health Educators', acronym: 'CHE',
    category: 'Community Service', subcategory: 'Health',
    tagline: 'Health education in New Haven schools',
    description:
      'CHE trains Yale undergraduates to teach health curricula — nutrition, sexual health, mental health and substance use — in New Haven public schools. Volunteers teach weekly in pairs after a training program each fall.',
    day: 'Wednesday', time: '6:00 PM', where: 'Dwight Hall Common Room', apply: false,
    size: 90, hours: 4, rating: 4.6, hue: 186,
  }),
  club({
    slug: 'best-buddies-yale', name: 'Best Buddies at Yale',
    category: 'Community Service', subcategory: 'Disability Inclusion',
    tagline: 'One-to-one friendships with adults with disabilities',
    description:
      'The Yale chapter of Best Buddies pairs students in one-to-one friendships with adults with intellectual and developmental disabilities in the New Haven area, and organizes group social events throughout the year.',
    day: 'Sunday', time: '3:00 PM', where: 'Dwight Hall, 67 High St', apply: false,
    size: 75, hours: 3, rating: 4.7, hue: 210,
  }),
  club({
    slug: 'habitat-for-humanity-yale', name: 'Habitat for Humanity, Yale Chapter',
    category: 'Community Service', subcategory: 'Housing',
    tagline: 'Building homes with Habitat New Haven',
    description:
      'The Yale chapter of Habitat for Humanity organizes weekend build days with Habitat for Humanity of Greater New Haven, alongside fundraising and housing-advocacy programming. No construction experience is needed.',
    day: 'Saturday', time: '8:00 AM', where: 'Phelps Gate (departure)', apply: false,
    size: 85, hours: 5, rating: 4.5, hue: 122,
  }),
  club({
    slug: 'yale-refugee-project', name: 'Yale Refugee Project', acronym: 'YRP',
    category: 'Community Service', subcategory: 'Immigration',
    tagline: 'Direct support for resettled families in New Haven',
    description:
      'The Yale Refugee Project supports refugee and immigrant families resettled in New Haven through tutoring, ESL instruction, employment and housing navigation, and partnership with local resettlement agencies. It also runs education and advocacy programming on campus.',
    day: 'Monday', time: '7:00 PM', where: 'Dwight Hall, 67 High St', apply: false,
    size: 100, hours: 4, rating: 4.7, hue: 174,
  }),
  club({
    slug: 'yale-undergraduate-prison-project', name: 'Yale Undergraduate Prison Project', acronym: 'YUPP',
    category: 'Community Service', subcategory: 'Criminal Justice',
    tagline: 'Education and advocacy in Connecticut prisons',
    description:
      'YUPP runs tutoring and educational programming inside Connecticut correctional facilities, supports reentry work in New Haven, and organizes campus education on incarceration and criminal justice policy. Volunteers complete a clearance and training process before facility placement.',
    day: 'Thursday', time: '7:00 PM', where: 'Dwight Hall, 67 High St', apply: true,
    size: 60, hours: 5, sel: 2.5, rating: 4.6, hue: 232,
  }),
  club({
    slug: 'matriculate-at-yale', name: 'Matriculate at Yale',
    category: 'Community Service', subcategory: 'Education Access',
    tagline: 'Virtual college advising for high-achieving, low-income students',
    description:
      'Matriculate trains Yale undergraduates as virtual advisors who guide high-achieving, low-income high school students through the entire college application process over two years — school lists, essays, financial aid and enrollment decisions.',
    day: 'Sunday', time: '8:00 PM', where: 'Bass Library L06', apply: true,
    size: 80, hours: 4, sel: 2.4, rating: 4.7, hue: 48,
  }),
  club({
    slug: 'kesem-at-yale', name: 'Kesem at Yale',
    category: 'Community Service', subcategory: 'Youth',
    tagline: 'A free summer camp for children affected by a parent’s cancer',
    description:
      'Kesem at Yale runs a free week-long summer camp for children whose parents have been affected by cancer, plus year-round family programming. Students serve as counselors and on fundraising, operations and outreach teams; the chapter raises its entire budget itself.',
    day: 'Sunday', time: '6:30 PM', where: 'Dwight Hall Common Room', apply: true,
    size: 70, hours: 5, sel: 2.8, rating: 4.8, hue: 96,
  }),
  club({
    slug: 'yale-sustainable-food-program', name: 'Yale Sustainable Food Program', acronym: 'YSFP',
    category: 'Community Service', subcategory: 'Food & Sustainability',
    tagline: 'The Yale Farm and food-systems education',
    description:
      'The YSFP runs the Yale Farm on Edwards Street — an organic market garden where students work Friday afternoon workdays, cook in the wood-fired oven, and run food-systems education, research and advocacy programming. Workdays are open to anyone with no signup.',
    day: 'Friday', time: '1:00 PM', where: 'Yale Farm, 345 Edwards St', apply: false,
    size: 150, hours: 3, rating: 4.8, hue: 108,
  }),

  // ==================================================================
  // CLUB SPORTS & OUTDOORS
  // ==================================================================
  club({
    slug: 'yale-ultimate-superfly', name: 'Yale Men’s Ultimate — Superfly',
    category: 'Club Sports & Outdoors', subcategory: 'Ultimate Frisbee',
    tagline: 'Yale’s men’s club ultimate team',
    description:
      'Superfly is Yale’s men’s club ultimate frisbee team, competing in the USA Ultimate college series with fall and spring tournament schedules. New players with no ultimate background are actively recruited and taught from the start of the fall season.',
    day: 'Tuesday', time: '4:30 PM', where: 'Yale Athletic Fields', apply: false,
    size: 35, hours: 8, rating: 4.6, hue: 218,
  }),
  club({
    slug: 'yale-ultimate-ramona', name: 'Yale Women’s Ultimate — Ramona',
    category: 'Club Sports & Outdoors', subcategory: 'Ultimate Frisbee',
    tagline: 'Yale’s women’s club ultimate team',
    description:
      'Ramona is Yale’s women’s club ultimate frisbee team, competing in the USA Ultimate college series. The team welcomes complete beginners and runs a dedicated fall development program alongside its tournament schedule.',
    day: 'Thursday', time: '4:30 PM', where: 'Yale Athletic Fields', apply: false,
    size: 30, hours: 8, rating: 4.7, hue: 320,
  }),
  club({
    slug: 'yale-outdoors', name: 'Yale Outdoors',
    category: 'Club Sports & Outdoors', subcategory: 'Outdoors',
    tagline: 'Free weekend trips: hiking, camping, climbing, skiing',
    description:
      'Yale Outdoors runs subsidized weekend and day trips — hiking, backpacking, camping, canoeing, climbing, skiing and apple picking — open to any student regardless of experience. Gear is provided, trips are heavily subsidized, and signups are first-come.',
    day: 'Wednesday', time: '8:00 PM', where: 'Outdoor Education Center', apply: false,
    size: 400, hours: 4, rating: 4.8, hue: 136,
  }),
  club({
    slug: 'yale-cycling', name: 'Yale Cycling',
    category: 'Club Sports & Outdoors', subcategory: 'Cycling',
    tagline: 'Road, mountain and cyclocross racing',
    description:
      'Yale Cycling trains and races in the Eastern Collegiate Cycling Conference across road, mountain, track and cyclocross disciplines, and also runs casual group rides in the Connecticut countryside for non-racers.',
    day: 'Saturday', time: '9:00 AM', where: 'Payne Whitney Gym (departure)', apply: false,
    size: 40, hours: 7, rating: 4.5, hue: 194,
  }),
  club({
    slug: 'yale-club-soccer', name: 'Yale Club Soccer',
    category: 'Club Sports & Outdoors', subcategory: 'Soccer',
    tagline: 'Competitive club soccer',
    description:
      'Yale Club Soccer fields competitive teams that play in a regional collegiate club league with a full fall and spring schedule, practicing several times a week. Tryouts are held at the start of the fall term.',
    day: 'Monday', time: '5:00 PM', where: 'Johnson Field', apply: true,
    size: 45, hours: 7, sel: 3.2, rating: 4.4, hue: 116,
  }),
  club({
    slug: 'yale-club-volleyball', name: 'Yale Club Volleyball',
    category: 'Club Sports & Outdoors', subcategory: 'Volleyball',
    tagline: 'Competitive and recreational volleyball',
    description:
      'Yale Club Volleyball fields competitive teams in regional collegiate club play and also runs open recreational sessions for students who want to play without the tournament commitment.',
    day: 'Wednesday', time: '8:00 PM', where: 'Payne Whitney Gym, Lanman Center', apply: true,
    size: 40, hours: 6, sel: 3.0, rating: 4.4, hue: 34,
  }),
  club({
    slug: 'yale-rugby', name: 'Yale Rugby Football Club',
    category: 'Club Sports & Outdoors', subcategory: 'Rugby',
    tagline: 'One of the oldest rugby clubs in the country',
    description:
      'The Yale Rugby Football Club competes in collegiate 15s in the fall and 7s in the spring. It is one of the oldest rugby programs in the United States and recruits players with no prior rugby experience every year.',
    day: 'Tuesday', time: '5:30 PM', where: 'Yale Rugby Pitch', apply: false,
    size: 45, hours: 8, rating: 4.6, hue: 224,
  }),
  club({
    slug: 'yale-sailing', name: 'Yale Sailing',
    category: 'Club Sports & Outdoors', subcategory: 'Sailing',
    tagline: 'Learn-to-sail and recreational sailing on Long Island Sound',
    description:
      'Yale Sailing offers learn-to-sail instruction and recreational sailing out of the McNay Family Sailing Center on Long Island Sound, open to students with no sailing background alongside experienced sailors.',
    day: 'Saturday', time: '10:00 AM', where: 'McNay Family Sailing Center, Branford', apply: false,
    size: 60, hours: 5, rating: 4.6, hue: 200,
  }),
  club({
    slug: 'yale-climbing', name: 'Yale Climbing Team',
    category: 'Club Sports & Outdoors', subcategory: 'Climbing',
    tagline: 'Bouldering, sport climbing and competition',
    description:
      'The Yale Climbing Team trains at the Payne Whitney climbing wall and local gyms, competes in USA Climbing collegiate events, and organizes outdoor trips to nearby crags. Beginners are welcome and taught to belay.',
    day: 'Monday', time: '7:00 PM', where: 'Payne Whitney Gym Climbing Wall', apply: false,
    size: 55, hours: 5, rating: 4.6, hue: 26,
  }),
  club({
    slug: 'yale-ski-team', name: 'Yale Ski & Snowboard Team',
    category: 'Club Sports & Outdoors', subcategory: 'Snow Sports',
    tagline: 'Racing and recreational trips in New England',
    description:
      'The Yale Ski & Snowboard Team races in collegiate alpine competition in New England during the winter and organizes recreational trips for members who want to ski without racing.',
    day: 'Sunday', time: '9:00 PM', where: 'Payne Whitney Gym Lobby', apply: false,
    size: 45, hours: 6, rating: 4.5, hue: 188,
  }),
  club({
    slug: 'yale-table-tennis', name: 'Yale Table Tennis',
    category: 'Club Sports & Outdoors', subcategory: 'Table Tennis',
    tagline: 'Open play and collegiate competition',
    description:
      'Yale Table Tennis holds open practice sessions for all skill levels and sends a competitive team to collegiate tournaments in the Northeast region.',
    day: 'Thursday', time: '8:00 PM', where: 'Payne Whitney Gym, Room 200', apply: false,
    size: 40, hours: 3, rating: 4.3, hue: 344,
  }),
  club({
    slug: 'yale-quadball', name: 'Yale Quadball',
    category: 'Club Sports & Outdoors', subcategory: 'Quadball',
    tagline: 'Full-contact, co-ed, on brooms',
    description:
      'Yale Quadball (formerly Quidditch) is a full-contact, mixed-gender sport combining elements of rugby, dodgeball and handball. The team practices weekly and travels to regional tournaments; no experience is needed and equipment is provided.',
    day: 'Sunday', time: '1:00 PM', where: 'Old Campus', apply: false,
    size: 30, hours: 4, rating: 4.6, hue: 276,
  }),

  // ==================================================================
  // HOBBIES & RECREATION
  // ==================================================================
  club({
    slug: 'yale-chess-club', name: 'Yale Chess Club',
    category: 'Hobbies & Recreation', subcategory: 'Games',
    tagline: 'Casual play, lessons and collegiate competition',
    description:
      'The Yale Chess Club runs weekly casual play and blitz nights, lessons for improving players, and sends teams to collegiate tournaments including the Pan-American Intercollegiate Championship. All ratings welcome.',
    day: 'Wednesday', time: '7:00 PM', where: 'Bass Library L01', apply: false,
    size: 55, hours: 2, rating: 4.4, hue: 240,
  }),
  club({
    slug: 'yale-anime-society', name: 'Yale Anime Society',
    category: 'Hobbies & Recreation', subcategory: 'Media',
    tagline: 'Weekly screenings and discussion',
    description:
      'The Yale Anime Society hosts weekly screenings, seasonal watch parties, discussion nights and an annual convention trip. Membership is entirely drop-in.',
    day: 'Friday', time: '8:00 PM', where: 'William L. Harkness Hall 208', apply: false,
    size: 70, hours: 2, rating: 4.4, hue: 300,
  }),

  // ==================================================================
  // STUDENT GOVERNMENT & WELLNESS
  // ==================================================================
  club({
    slug: 'yale-college-council', name: 'Yale College Council', acronym: 'YCC',
    category: 'Student Government', subcategory: 'Governance',
    tagline: 'The undergraduate student government',
    description:
      'The Yale College Council is the undergraduate student government. It advocates to the administration on academic policy, dining, mental health, financial aid and campus life; runs referenda and surveys; and administers funding for student organizations. Senators are elected by residential college and first-year class.',
    day: 'Sunday', time: '7:00 PM', where: 'Sheffield-Sterling-Strathcona Hall 114', apply: false,
    size: 60, hours: 6, rating: 4.0, hue: 222,
  }),
  club({
    slug: 'walden-peer-counseling', name: 'Walden Peer Counseling',
    category: 'Health & Wellness', subcategory: 'Peer Support',
    tagline: 'Confidential, anonymous peer counseling',
    description:
      'Walden Peer Counseling operates a confidential, anonymous peer counseling hotline and drop-in hours staffed by trained undergraduates. Counselors complete an intensive selection and training process covering active listening, crisis response and referral before taking calls.',
    day: 'Sunday', time: '4:00 PM', where: 'Confidential', apply: true,
    size: 45, hours: 6, sel: 4.4, rating: 4.7, hue: 180,
  }),
  club({
    slug: 'communication-and-consent-educators', name: 'Communication and Consent Educators', acronym: 'CCEs',
    category: 'Health & Wellness', subcategory: 'Peer Education',
    tagline: 'Peer educators on consent and healthy relationships',
    description:
      'CCEs are undergraduates selected and trained to lead workshops and community conversations on consent, healthy relationships and sexual misconduct prevention within their residential colleges and across campus. Selection is competitive and includes an interview.',
    day: 'Monday', time: '6:00 PM', where: 'Sheffield-Sterling-Strathcona Hall 201', apply: true,
    size: 50, hours: 5, sel: 4.2, rating: 4.6, hue: 288,
  }),
  club({
    slug: 'yale-peer-health-educators', name: 'Peer Health Educators', acronym: 'PHE',
    category: 'Health & Wellness', subcategory: 'Peer Education',
    tagline: 'Health and wellness programming in the residential colleges',
    description:
      'Peer Health Educators run health and wellness programming in the residential colleges — sleep, stress, nutrition, substance use and sexual health — and serve as a first point of contact connecting students to Yale Health resources.',
    day: 'Tuesday', time: '6:00 PM', where: 'Yale Health, 55 Lock St', apply: true,
    size: 45, hours: 4, sel: 3.4, rating: 4.5, hue: 166,
  }),
];

module.exports = { CLUBS, DEMO_DOMAIN };
