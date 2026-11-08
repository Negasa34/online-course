module.exports = [
  {
    questionKey: "final-profile-page",
    type: "practical",
    prompt: "Build a personal profile page with a meaningful document title, one main heading, a short biography, and a contact link.",
    explanation: "A successful page uses a useful document title, a logical heading, descriptive prose, and a link whose destination and purpose are clear.",
    starterCode: "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>Replace with a descriptive title</title>\n</head>\n<body>\n  <main>\n    <!-- Build your profile here -->\n  </main>\n</body>\n</html>",
    requirements: ["Include one h1 with the learner's name.", "Include a paragraph describing the person.", "Include a link with an informative href."],
    hints: ["Use one main heading to identify the page.", "Write link text that makes sense out of context."],
    rubric: ["Valid document structure and descriptive title.", "Semantic main content with a clear h1.", "Readable biography and useful contact link.", "Accessible, descriptive link text."],
    solutionCode: "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Alex Morgan | Web Developer</title>\n</head>\n<body>\n  <main>\n    <h1>Alex Morgan</h1>\n    <p>I am a university student learning accessible web development.</p>\n    <a href=\"mailto:alex@example.com\">Email Alex Morgan</a>\n  </main>\n</body>\n</html>",
    solutionExplanation: "The document declares its language and character encoding, includes a responsive viewport, and uses a title that identifies the page. A main landmark groups the unique page content. The heading introduces the profile, the paragraph gives context, and the link uses an email URL with descriptive text."
  },
  {
    questionKey: "final-semantic-article",
    type: "practical",
    prompt: "Create a semantic article about a local community event with a heading, publication date, two paragraphs, and a related-navigation link.",
    explanation: "Semantic article content can stand on its own. A machine-readable time value supplements, rather than replaces, the date displayed to readers.",
    starterCode: "<!doctype html>\n<html lang=\"en\">\n<head><meta charset=\"utf-8\"><title>Community story</title></head>\n<body>\n  <!-- Add semantic article content -->\n</body>\n</html>",
    requirements: ["Use an article element.", "Include a heading inside the article.", "Use time with a valid datetime value.", "Include at least two paragraphs."],
    hints: ["The datetime value should use an ISO-style date.", "Keep the readable date inside the time element."],
    rubric: ["A self-contained article is marked up semantically.", "Heading and paragraphs organize the story.", "The time element has a machine-readable datetime.", "Navigation link has a meaningful destination and name."],
    solutionCode: "<!doctype html>\n<html lang=\"en\">\n<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Community garden story</title></head>\n<body>\n  <main>\n    <article>\n      <h1>Neighbors open a community garden</h1>\n      <p>Residents worked together to prepare a shared growing space.</p>\n      <p>The garden will host weekly volunteer sessions through summer.</p>\n      <p>Published <time datetime=\"2026-06-14\">June 14, 2026</time>.</p>\n    </article>\n    <nav aria-label=\"Related stories\"><a href=\"stories.html\">Read more community stories</a></nav>\n  </main>\n</body>\n</html>",
    solutionExplanation: "The main landmark identifies the page's unique content. The article groups a story that can stand on its own. Its heading describes the story, and paragraphs keep related prose readable. The time element exposes a normalized date to software while preserving a human-friendly date. A labelled navigation landmark provides a related link."
  },
  {
    questionKey: "final-accessible-contact-form",
    type: "practical",
    prompt: "Create an accessible contact form with name, email, message, a required consent checkbox, and a submit button.",
    explanation: "Reliable forms pair every control with a programmatic label, choose controls appropriate to the data, and communicate required status in text as well as native validation.",
    starterCode: "<form action=\"/contact\" method=\"post\">\n  <!-- Add labelled controls -->\n</form>",
    requirements: ["Include explicitly associated labels for name, email, and message.", "Use email input type.", "Mark required fields required.", "Include a required consent checkbox.", "Include a submit button."],
    hints: ["Match each label's for value with its input id.", "Use a textarea for a message that can span multiple lines."],
    rubric: ["Controls have unique IDs and associated labels.", "Email and message use suitable semantic controls.", "Required status is conveyed with native attributes.", "Consent is a required checkbox.", "The form has a clear submit button."],
    solutionCode: "<form action=\"/contact\" method=\"post\">\n  <p><label for=\"name\">Your name</label><input id=\"name\" name=\"name\" autocomplete=\"name\" required></p>\n  <p><label for=\"email\">Email address</label><input id=\"email\" name=\"email\" type=\"email\" autocomplete=\"email\" required></p>\n  <p><label for=\"message\">Message</label><textarea id=\"message\" name=\"message\" rows=\"5\" required></textarea></p>\n  <p><input id=\"consent\" name=\"consent\" type=\"checkbox\" required><label for=\"consent\">I agree to be contacted about this message.</label></p>\n  <button type=\"submit\">Send message</button>\n</form>",
    solutionExplanation: "Each label is associated through matching for and id values, so assistive technology announces the control purpose. Name and email autocomplete hints help users fill fields. Email uses the browser's email input semantics. Textarea supports a longer response. Required constraints are native and the consent checkbox is explicit. The submit button has an action-oriented name."
  },
  {
    questionKey: "final-responsive-images",
    type: "practical",
    prompt: "Mark up an article image with responsive source choices, a meaningful alternative, and a visible caption.",
    explanation: "Responsive image markup lets the browser choose an appropriate source while retaining an img fallback. Alternative text communicates the image's relevant meaning; a caption can provide visible context.",
    starterCode: "<figure>\n  <!-- Add responsive image markup and caption -->\n</figure>",
    requirements: ["Use picture and source elements with a media condition.", "Include an img fallback with src and alt.", "Include a figcaption."],
    hints: ["The img element remains inside picture and supplies the fallback.", "Describe what matters in the specific article context."],
    rubric: ["Responsive source precedes the fallback image.", "Fallback has a usable src and contextual alt.", "Caption is associated using figure/figcaption.", "Markup remains understandable if only the fallback is used."],
    solutionCode: "<figure>\n  <picture>\n    <source media=\"(min-width: 800px)\" srcset=\"garden-wide.jpg\">\n    <img src=\"garden-square.jpg\" alt=\"Volunteers planting seedlings in raised garden beds\">\n  </picture>\n  <figcaption>Volunteers prepare the first beds at the neighborhood garden.</figcaption>\n</figure>",
    solutionExplanation: "The picture element lets the browser select the wide source at the stated viewport condition. The nested img is the required fallback and carries meaningful alternative text. Figure associates the media and its visible figcaption, which supplies context for all readers."
  },
  {
    questionKey: "final-data-table",
    type: "practical",
    prompt: "Represent three weekly class sessions in an accessible table with a caption, column headers, and a table body.",
    explanation: "Use tables for data with row-and-column relationships, not for page layout. Captions describe the dataset; scoped headers help users understand each cell's relationship to its row or column.",
    starterCode: "<table>\n  <!-- Add a caption, headings, and rows -->\n</table>",
    requirements: ["Include a caption.", "Use thead and tbody.", "Use th with scope=\"col\" for each column.", "Include at least three data rows."],
    hints: ["Give each row the same number of cells.", "Use readable column headings and keep the caption concise."],
    rubric: ["Table is used for tabular data.", "Caption identifies the schedule.", "Column headers use scope correctly.", "Three complete body rows are present."],
    solutionCode: "<table>\n  <caption>Weekly HTML workshop schedule</caption>\n  <thead><tr><th scope=\"col\">Day</th><th scope=\"col\">Topic</th><th scope=\"col\">Room</th></tr></thead>\n  <tbody>\n    <tr><td>Monday</td><td>Document structure</td><td>Room 2</td></tr>\n    <tr><td>Wednesday</td><td>Forms</td><td>Room 2</td></tr>\n    <tr><td>Friday</td><td>Accessibility</td><td>Room 4</td></tr>\n  </tbody>\n</table>",
    solutionExplanation: "The caption names the dataset. The header row is grouped in thead, and each th declares a column relationship using scope. The body contains three consistent rows of data. This structure provides relationships that visual alignment alone would not communicate."
  }
];
