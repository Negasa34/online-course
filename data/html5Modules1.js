module.exports = [
  {
    slug: "introduction-to-html",
    title: "Introduction to HTML",
    summary: "Learn what HTML does, how browsers interpret markup, and how to author clear, accessible HTML fragments.",
    objectives: [
      "Describe HTML as the structural markup language of the web and distinguish it from CSS and JavaScript.",
      "Recognize elements, tags, attributes, and text content in a small HTML fragment.",
      "Create well-formed elements with meaningful text and appropriate attributes."
    ],
    lessons: [
      {
        slug: "what-html-is",
        title: "What HTML Is and How Browsers Use It",
        minutes: 12,
        introduction: "HTML gives web content structure and meaning. In this lesson, you will read a small fragment and see how a browser turns its markup into a document users can navigate.",
        objectives: [
          "Explain the roles of HTML, CSS, and JavaScript in a web page.",
          "Identify an HTML element's opening tag, content, and closing tag."
        ],
        explanation: [
          "HTML (HyperText Markup Language) describes the structure and meaning of content. Elements such as headings, paragraphs, and links tell the browser what each piece of content represents. The browser parses the markup into a document tree, then presents that document visually or through other interfaces such as a screen reader. HTML is not a programming language: its tags mark up content rather than describing calculations or control flow.",
          "CSS controls presentation, including color, spacing, and layout, while JavaScript can respond to events and update a page. Keeping these responsibilities distinct makes documents easier to understand and maintain. An element normally consists of an opening tag, content, and a closing tag. Some elements have no content and are called void elements. Tags are written with angle brackets, and HTML element names are conventionally written in lowercase."
        ],
        terminology: [
          { term: "HTML", definition: "A markup language for describing the structure and meaning of web content." },
          { term: "Element", definition: "A unit of HTML, commonly made from a start tag, content, and an end tag." },
          { term: "Tag", definition: "Markup in angle brackets that identifies an element's start, end, or void form." },
          { term: "Browser", definition: "Software that parses web documents and presents their content to people." }
        ],
        syntax: "<element>content</element>",
        codeExample: {
          code: "<h1>Welcome to the web</h1>\n<p>HTML gives this text structure.</p>",
          lines: [
            "Creates a top-level heading with the text “Welcome to the web.”",
            "Creates a paragraph explaining that HTML gives text structure."
          ],
          output: "A prominent heading, “Welcome to the web,” followed by a paragraph explaining that HTML structures text."
        },
        commonMistakes: [
          "Treating HTML as a visual styling language and choosing elements only for their default appearance.",
          "Leaving off an end tag for a non-void element, which can cause later content to be interpreted as part of it."
        ],
        bestPractices: [
          "Choose elements for the meaning of the content, then use CSS when you need to change its appearance.",
          "Use lowercase tag names and indent nested markup consistently so structure is easy to review."
        ],
        exercise: {
          title: "Introduce a Web Page",
          difficulty: "beginner",
          instructions: "Complete the fragment with a first-level heading and a paragraph that tells a new learner what HTML does.",
          starterCode: "<!-- Add a heading and a paragraph below -->",
          requirements: [
            { type: "element-text", selector: "h1", text: "Learning HTML" },
            { type: "element-exists", selector: "p" }
          ],
          hints: [
            "A heading is written with an h1 start tag and a matching h1 end tag.",
            "Write the paragraph inside p tags and make its sentence describe structure or meaning."
          ],
          solutionCode: "<h1>Learning HTML</h1>\n<p>HTML gives web content structure and meaning.</p>",
          solutionExplanation: "The h1 identifies the page's main heading, while the paragraph is a separate block of explanatory text. Both elements have matching start and end tags."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which technology describes the meaning and structure of page content?",
            choices: [
              { id: "a", text: "HTML" },
              { id: "b", text: "CSS" },
              { id: "c", text: "JavaScript" }
            ],
            correctChoiceId: "a",
            explanation: "HTML marks up content and its structure; CSS handles presentation and JavaScript handles behavior."
          },
          {
            type: "true-false",
            prompt: "A normal HTML element can contain text between its opening and closing tags.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Elements such as p and h1 have start and end tags with their content between them."
          },
          {
            type: "code-output",
            prompt: "What content is represented by <p>Read carefully.</p>?",
            choices: [
              { id: "a", text: "A paragraph containing “Read carefully.”" },
              { id: "b", text: "A top-level heading" },
              { id: "c", text: "A stylesheet rule" }
            ],
            correctChoiceId: "a",
            explanation: "The p element identifies its text as a paragraph."
          }
        ],
        summary: "HTML marks up meaningful structure; browsers parse elements and present their content. Select elements according to meaning, not merely their default appearance."
      },
      {
        slug: "elements-attributes-and-text",
        title: "Elements, Attributes, and Text",
        minutes: 14,
        introduction: "Elements organize text, and attributes add information to an element. You will practice reading the pieces of an element and using an attribute with a specific meaning.",
        objectives: [
          "Distinguish an HTML attribute name and value from an element's text content.",
          "Write quoted attribute values in a start tag."
        ],
        explanation: [
          "An attribute appears in an element's start tag and provides additional information or configures the element. In the fragment below, lang is the attribute name and en is its value. Attribute values should be quoted, especially when they contain spaces or punctuation; consistently using double quotes also makes markup easier to scan. An attribute is not displayed as ordinary text content, although it can affect the browser's behavior or assistive technology.",
          "Attributes belong only on elements that support them, and some attributes are global while others are element-specific. The title attribute can provide advisory information, but it should not replace visible instructions or an accessible name. Content that users need should generally appear as text or be exposed through an appropriate semantic element. Valid nesting and precise attribute values make a document more predictable for browsers, scripts, and people using assistive technologies."
        ],
        terminology: [
          { term: "Attribute", definition: "A name-value setting written in an element's start tag." },
          { term: "Attribute value", definition: "The quoted setting associated with an attribute name." },
          { term: "Content", definition: "Text or nested elements placed between an element's tags." }
        ],
        syntax: '<element attribute="value">content</element>',
        codeExample: {
          code: '<p lang="en">A sentence in English.</p>',
          lines: [
            "Creates a paragraph whose lang attribute is en and whose visible text is “A sentence in English.”"
          ],
          output: "A paragraph reading “A sentence in English.” The language metadata identifies its text as English."
        },
        commonMistakes: [
          "Writing an attribute after the closing angle bracket instead of inside the start tag.",
          "Using an attribute as a substitute for visible content or an accessible label."
        ],
        bestPractices: [
          "Quote attribute values consistently and keep each attribute with the element it configures.",
          "Use attributes to provide appropriate metadata; keep essential instructions in visible content."
        ],
        exercise: {
          title: "Mark a Language",
          difficulty: "beginner",
          instructions: "Create a paragraph with the exact sentence below and identify its language as English using a lang attribute.",
          starterCode: "<!-- Create the paragraph -->",
          requirements: [
            { type: "element-text", selector: "p", text: "Welcome to the lesson." },
            { type: "attribute-equals", selector: "p", attribute: "lang", value: "en" }
          ],
          hints: [
            "Place lang=\"en\" inside the p start tag.",
            "The sentence goes between the opening and closing p tags."
          ],
          solutionCode: '<p lang="en">Welcome to the lesson.</p>',
          solutionExplanation: "The lang attribute is metadata on the paragraph element, and its visible sentence remains the paragraph's text content."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Where does an attribute appear?",
            choices: [
              { id: "a", text: "In an element's start tag" },
              { id: "b", text: "Only after the document ends" },
              { id: "c", text: "As the closing tag's text" }
            ],
            correctChoiceId: "a",
            explanation: "Attributes are written in the start tag, such as lang=\"en\" in <p lang=\"en\">."
          },
          {
            type: "true-false",
            prompt: "The value in lang=\"en\" is ordinary visible paragraph text.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "It is attribute metadata; the text between the tags is the visible paragraph content."
          },
          {
            type: "code-output",
            prompt: "What is the value of the title attribute in <p title=\"Tip\">Read this.</p>?",
            choices: [
              { id: "a", text: "Tip" },
              { id: "b", text: "Read this." },
              { id: "c", text: "p" }
            ],
            correctChoiceId: "a",
            explanation: "The quoted text immediately following title= is the attribute's value."
          }
        ],
        summary: "Attributes are name-value settings in a start tag. Quote their values, use attributes supported by the element, and do not hide essential content in metadata."
      }
    ]
  },
  {
    slug: "html-document-structure",
    title: "HTML Document Structure",
    summary: "Turn a fragment into a complete, well-formed HTML document and organize page content with semantic regions.",
    objectives: [
      "Build a minimal HTML document with a doctype, root, head, and body.",
      "Use metadata and semantic regions to communicate the organization of a page."
    ],
    lessons: [
      {
        slug: "complete-html-document",
        title: "Building a Complete HTML Document",
        minutes: 16,
        introduction: "A browser can display fragments, but a complete page has a predictable document skeleton. This lesson introduces the doctype, html, head, and body.",
        objectives: [
          "Identify the purpose of the doctype, html, head, and body.",
          "Place page metadata in the head and user-facing content in the body."
        ],
        explanation: [
          "A complete modern HTML document begins with <!doctype html>, a declaration that tells the browser to use standards mode. The html element is the document root and contains two main regions: head and body. The head contains metadata about the document, such as its character encoding and title. The body contains the page's content, including headings, paragraphs, links, and images that are presented to users.",
          "The title element in the head names the page in browser tabs, bookmarks, and search results; it is not the visible page heading. A meta charset declaration helps the browser interpret text consistently, including characters outside basic English. Elements should be nested properly: body belongs inside html, and the head and body are siblings. A document's structure is useful even when CSS is absent because semantics and metadata do not depend on visual styling."
        ],
        terminology: [
          { term: "Doctype", definition: "The declaration that identifies the document as modern HTML and enables standards mode." },
          { term: "Head", definition: "The document region for metadata and references that are not page-body content." },
          { term: "Body", definition: "The document region containing the content presented as the page." },
          { term: "Metadata", definition: "Information about a document, such as its title or character encoding." }
        ],
        syntax: "<!doctype html> followed by html containing head and body",
        codeExample: {
          code: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>Field Notes</title>\n  </head>\n  <body>\n    <h1>Field Notes</h1>\n  </body>\n</html>',
          lines: [
            "Declares a modern HTML document.",
            "Opens the root element and identifies the document language as English.",
            "Opens the metadata region.",
            "Declares UTF-8 character encoding.",
            "Sets the document title shown in browser tabs.",
            "Closes the head region.",
            "Opens the page-content region.",
            "Adds the visible main heading.",
            "Closes the body region.",
            "Closes the root html element."
          ],
          output: "A complete page titled “Field Notes,” with an English-language document and a visible “Field Notes” heading."
        },
        commonMistakes: [
          "Putting the visible page heading inside head instead of body.",
          "Confusing the browser-tab title with the h1 heading shown in the page."
        ],
        bestPractices: [
          "Include a doctype, an appropriate document language, UTF-8 encoding, and a descriptive title.",
          "Keep metadata in head and user-facing content in body, with correctly nested elements."
        ],
        exercise: {
          title: "Build a Simple Document",
          difficulty: "beginner",
          instructions: "Complete the page with the required document title and visible heading. Include the standard document regions.",
          starterCode: "<!-- Build a complete HTML document -->",
          requirements: [
            { type: "element-text", selector: "title", text: "My Study Page" },
            { type: "element-text", selector: "body h1", text: "My Study Page" },
            { type: "element-exists", selector: "head" },
            { type: "element-exists", selector: "body" }
          ],
          hints: [
            "Start with <!doctype html> and put head and body inside html.",
            "The title belongs in head; the h1 belongs in body."
          ],
          solutionCode: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>My Study Page</title>\n  </head>\n  <body>\n    <h1>My Study Page</h1>\n  </body>\n</html>',
          solutionExplanation: "The document has the standard root and child regions. Its title and encoding are metadata, and the page heading is visible body content."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element contains the content presented within the page?",
            choices: [
              { id: "a", text: "body" },
              { id: "b", text: "head" },
              { id: "c", text: "title" }
            ],
            correctChoiceId: "a",
            explanation: "The body contains user-facing page content; the head contains document metadata."
          },
          {
            type: "true-false",
            prompt: "The title element in head is the same thing as the visible h1 heading.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "The title names the document for browser interfaces, while h1 is a visible content heading."
          },
          {
            type: "code-output",
            prompt: "In a document with <title>Garden</title>, where does “Garden” normally appear?",
            choices: [
              { id: "a", text: "In the browser tab or window title" },
              { id: "b", text: "Automatically as the page's h1" },
              { id: "c", text: "As an image alternative" }
            ],
            correctChoiceId: "a",
            explanation: "The title element supplies the document's title to browser interfaces; it does not create an h1."
          }
        ],
        summary: "A complete page has a doctype and an html root containing head metadata and body content. The document title and visible heading serve different purposes."
      },
      {
        slug: "semantic-page-regions",
        title: "Organizing Content with Semantic Regions",
        minutes: 15,
        introduction: "Semantic landmarks explain how sections of a page relate to one another. Learn when to use header, nav, main, and footer.",
        objectives: [
          "Choose landmark elements according to the role of their content.",
          "Use one main region for the page's primary content."
        ],
        explanation: [
          "Semantic HTML describes what a region is for rather than how it looks. A header can introduce a page or a section, nav groups important navigation links, main contains the dominant content of the page, and footer provides related closing information. These elements have browser and accessibility semantics that generic containers do not. They do not automatically create a layout or guarantee a particular visual style; CSS remains responsible for presentation.",
          "A page should generally have one main element representing its unique central content, with repeated site-wide navigation and branding outside it. Use a nav element for a significant group of navigation links, not every collection of links. A footer may appear within a section as well as at page level, so its meaning depends on its context. Choosing landmarks carefully helps people using assistive technology move around a document without relying solely on visual layout."
        ],
        terminology: [
          { term: "Landmark", definition: "A semantic region that helps users identify and navigate major areas of a page." },
          { term: "main", definition: "The landmark containing the unique, dominant content of a document." },
          { term: "nav", definition: "A landmark for a significant group of navigation links." },
          { term: "Semantic element", definition: "An element whose name communicates the role of its content." }
        ],
        syntax: "<header>...</header> <nav>...</nav> <main>...</main> <footer>...</footer>",
        codeExample: {
          code: "<header>\n  <h1>City Garden</h1>\n</header>\n<nav>\n  <a href=\"plants.html\">Plants</a>\n</nav>\n<main>\n  <p>Plan a small space for growing herbs.</p>\n</main>\n<footer>\n  <p>Updated in spring.</p>\n</footer>",
          lines: [
            "Begins the introductory page header.",
            "Names the site with its main heading.",
            "Closes the header region.",
            "Begins a significant navigation landmark.",
            "Adds a link to the plants page.",
            "Closes the navigation region.",
            "Begins the page's primary content landmark.",
            "Provides the central page information.",
            "Closes the main content region.",
            "Begins the page footer.",
            "Adds a short, related update note.",
            "Closes the footer."
          ],
          output: "A page organized into an introduction, a navigation link, primary gardening advice, and a footer note."
        },
        commonMistakes: [
          "Using main for a sidebar or repeated site-wide content rather than the unique primary content.",
          "Using nav for every set of links, including unrelated links that are not a major navigation group."
        ],
        bestPractices: [
          "Use semantic regions to convey the information architecture, then style those regions separately with CSS.",
          "Keep the primary page content in one main landmark and make navigation groups purposeful."
        ],
        exercise: {
          title: "Lay Out a Resource Page",
          difficulty: "beginner",
          instructions: "Create a page header, one main region containing a paragraph, and a footer containing an update note.",
          starterCode: "<!-- Add semantic page regions -->",
          requirements: [
            { type: "element-exists", selector: "header" },
            { type: "element-exists", selector: "main p" },
            { type: "element-text", selector: "footer p", text: "Updated today." }
          ],
          hints: [
            "Wrap the page introduction in header and the primary content in main.",
            "The footer's paragraph should contain the update note exactly."
          ],
          solutionCode: "<header>\n  <h1>Resource Guide</h1>\n</header>\n<main>\n  <p>Find a starting point for your research.</p>\n</main>\n<footer>\n  <p>Updated today.</p>\n</footer>",
          solutionExplanation: "Each region communicates its role: introduction, unique central content, and related closing information."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element identifies the unique, dominant content of a page?",
            choices: [
              { id: "a", text: "main" },
              { id: "b", text: "footer" },
              { id: "c", text: "head" }
            ],
            correctChoiceId: "a",
            explanation: "The main element contains the document's primary content."
          },
          {
            type: "true-false",
            prompt: "A nav element is appropriate for every group of links, regardless of purpose.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "Nav is intended for significant navigation groups, not every incidental set of links."
          },
          {
            type: "code-output",
            prompt: "What is conveyed by placing a site's principal link group inside <nav>?",
            choices: [
              { id: "a", text: "That the links form a navigation region" },
              { id: "b", text: "That the links are automatically hidden" },
              { id: "c", text: "That the links become headings" }
            ],
            correctChoiceId: "a",
            explanation: "Nav communicates the purpose of the link group as navigation."
          }
        ],
        summary: "Semantic regions communicate page organization to browsers and assistive technologies. Use landmarks for their intended roles, not just for styling."
      }
    ]
  },
  {
    slug: "html-text-elements",
    title: "HTML Text Elements",
    summary: "Structure headings and paragraphs, express emphasis and importance, represent notation and code, and quote sources accurately.",
    objectives: [
      "Create a logical heading hierarchy and readable paragraph content.",
      "Select text elements based on meaning, including emphasis, annotation, code, and quotations."
    ],
    lessons: [
      {
        slug: "headings-h1-to-h6",
        title: "Headings from h1 to h6",
        minutes: 14,
        introduction: "Headings give a document an outline. This lesson explains the six heading levels and why their order should reflect the content hierarchy.",
        objectives: [
          "Use h1 through h6 to identify headings at appropriate levels.",
          "Create a logical outline without skipping heading levels for visual effect."
        ],
        explanation: [
          "HTML provides six heading elements, h1 through h6, with h1 representing the highest level and h6 the lowest. A heading names the topic of the section that follows. A page's primary topic is usually introduced by h1, with h2 for its major sections and h3 for subsections within those sections. The exact visual size is browser styling, not the semantic meaning of the heading.",
          "Heading levels should describe the hierarchy of ideas, not provide a convenient font size. Skipping from h2 to h4 can imply a missing structural level and make the document harder to navigate for people who use heading lists. Add headings when they accurately summarize meaningful sections; do not make a heading solely to change typography. If a heading should look smaller or larger, CSS is the appropriate presentation tool."
        ],
        terminology: [
          { term: "Heading", definition: "A title for a page or section, represented by an h1-to-h6 element." },
          { term: "Outline", definition: "The hierarchy of topics and subtopics communicated by a document's headings." },
          { term: "Heading level", definition: "A heading's place in the hierarchy, where h1 is higher than h2 through h6." }
        ],
        syntax: "<h1>Page topic</h1> ... <h2>Section topic</h2>",
        codeExample: {
          code: "<h1>Coastal Birds</h1>\n<h2>Habitat</h2>\n<h3>Shoreline nests</h3>\n<p>Some species nest above the high-tide line.</p>",
          lines: [
            "Introduces the document's main topic.",
            "Begins a major section under the main topic.",
            "Begins a subsection within Habitat.",
            "Provides a paragraph about the subsection."
          ],
          output: "An outline with Coastal Birds as the main topic, Habitat as a section, and Shoreline nests as its subsection."
        },
        commonMistakes: [
          "Choosing h1, h2, or h3 only because its default text size looks right.",
          "Skipping a heading level when it changes the document's implied outline."
        ],
        bestPractices: [
          "Write headings that accurately summarize the content in the section that follows.",
          "Maintain a meaningful hierarchy and use CSS, not heading levels, to control visual size."
        ],
        exercise: {
          title: "Outline a Short Article",
          difficulty: "beginner",
          instructions: "Create an article title, a section heading, and a nested subsection heading, followed by the required paragraph.",
          starterCode: "<!-- Add a heading hierarchy and paragraph -->",
          requirements: [
            { type: "element-text", selector: "h1", text: "Backyard Birds" },
            { type: "element-text", selector: "h2", text: "Food" },
            { type: "element-text", selector: "h3", text: "Winter feeding" },
            { type: "element-exists", selector: "p" }
          ],
          hints: [
            "Use h1 for the article topic, h2 for its section, and h3 for the subsection.",
            "Put a sentence explaining winter feeding in a p element."
          ],
          solutionCode: "<h1>Backyard Birds</h1>\n<h2>Food</h2>\n<h3>Winter feeding</h3>\n<p>Offer suitable food when natural sources are scarce.</p>",
          solutionExplanation: "The headings form a descending topic hierarchy; the paragraph provides prose beneath the subsection."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element represents a subsection nested under an h2 section?",
            choices: [
              { id: "a", text: "h3" },
              { id: "b", text: "h1" },
              { id: "c", text: "p" }
            ],
            correctChoiceId: "a",
            explanation: "An h3 is one level below h2 and can identify a subsection within it."
          },
          {
            type: "true-false",
            prompt: "Heading levels should be chosen primarily to obtain a desired font size.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "Heading level communicates hierarchy; CSS controls text appearance."
          },
          {
            type: "code-output",
            prompt: "What structure is suggested by h1 followed by h2 and then h3?",
            choices: [
              { id: "a", text: "A main topic, a section, and a subsection" },
              { id: "b", text: "Three unrelated paragraphs" },
              { id: "c", text: "A link followed by two images" }
            ],
            correctChoiceId: "a",
            explanation: "Those heading levels express successively nested topics."
          }
        ],
        summary: "Use h1–h6 to communicate the hierarchy of topics. A logical outline improves navigation; use CSS to choose heading appearance."
      },
      {
        slug: "paragraphs-breaks-and-horizontal-rules",
        title: "Paragraphs, Line Breaks, and Horizontal Rules",
        minutes: 15,
        introduction: "Paragraphs group prose, br marks a meaningful line break, and hr signals a thematic change. Learn how these elements differ.",
        objectives: [
          "Use p elements to group related prose into paragraphs.",
          "Use br for a meaningful line break and hr for a thematic break rather than visual spacing."
        ],
        explanation: [
          "The p element represents a paragraph, a self-contained block of prose. Start a new paragraph when the content forms a new thought; browsers add default spacing, but the semantic role remains even if that styling changes. HTML source whitespace is generally collapsed by browsers, so pressing Enter in source code does not reliably create a visible line break. Separate ideas with paragraphs rather than manually formatting source lines.",
          "The br element represents a line break that belongs to the content, such as a line in an address or poem; it is a void element and has no closing tag. The hr element represents a thematic change between sections, not a decorative line or generic spacing device. Both should be used sparingly and meaningfully. For larger spacing or decorative separators, CSS is a better tool because it separates presentation from document meaning."
        ],
        terminology: [
          { term: "Paragraph", definition: "A prose grouping represented by the p element." },
          { term: "Void element", definition: "An element that cannot contain content and has no end tag, such as br." },
          { term: "Thematic break", definition: "A change in topic or scene that can be represented by hr." }
        ],
        syntax: "<p>Paragraph text.</p> · meaningful<br>line break · <hr>",
        codeExample: {
          code: "<p>Morning walk</p>\n<p>Follow the river path.<br>Return before noon.</p>\n<hr>\n<p>Afternoon plans</p>",
          lines: [
            "Creates the first paragraph, introducing the morning walk.",
            "Creates one directions paragraph and includes a meaningful br between its two lines.",
            "Marks the thematic transition between itinerary topics.",
            "Creates a separate paragraph for the afternoon plans."
          ],
          output: "Two topics separated by a thematic break; the river-path directions stay in one paragraph with a deliberate line break."
        },
        commonMistakes: [
          "Using many br elements to create vertical spacing instead of paragraphs or CSS.",
          "Adding hr solely as decoration when no thematic change occurs."
        ],
        bestPractices: [
          "Use p for prose units, br only where the line boundary is part of the content, and hr for a topic shift.",
          "Use CSS for layout and decorative spacing rather than repeated structural elements."
        ],
        exercise: {
          title: "Format a Short Itinerary",
          difficulty: "beginner",
          instructions: "Create a paragraph with two lines for an address, then mark the transition to a second topic with hr and add its paragraph.",
          starterCode: "<!-- Format the itinerary -->",
          requirements: [
            { type: "element-exists", selector: "p br" },
            { type: "element-exists", selector: "hr" },
            { type: "element-text", selector: "p:last-child", text: "Next: visit the museum." }
          ],
          hints: [
            "Keep both address lines in one paragraph and insert one br between them.",
            "Place hr between the address and the paragraph about the next activity."
          ],
          solutionCode: "<p>12 River Road<br>Harbor City</p>\n<hr>\n<p>Next: visit the museum.</p>",
          solutionExplanation: "The address has a content-driven line break in one paragraph. The horizontal rule represents a thematic transition to the next itinerary item."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element is intended to identify a thematic change?",
            choices: [
              { id: "a", text: "hr" },
              { id: "b", text: "br" },
              { id: "c", text: "title" }
            ],
            correctChoiceId: "a",
            explanation: "The hr element represents a thematic break; br represents a line break."
          },
          {
            type: "true-false",
            prompt: "The br element is a void element and does not have a closing tag.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Br cannot contain content and is written without an end tag."
          },
          {
            type: "code-output",
            prompt: "How many paragraph elements are in <p>One.</p><p>Two.</p>?",
            choices: [
              { id: "a", text: "Two" },
              { id: "b", text: "One" },
              { id: "c", text: "Zero" }
            ],
            correctChoiceId: "a",
            explanation: "Each p start tag begins a distinct paragraph, so this fragment contains two."
          }
        ],
        summary: "Paragraphs structure prose, br marks a meaningful line boundary, and hr marks a thematic shift. Avoid using structural elements just for spacing."
      },
      {
        slug: "importance-and-emphasis",
        title: "Strong Importance and Emphasis",
        minutes: 13,
        introduction: "The strong and em elements communicate importance and stress emphasis. Their meaning is more useful than their common bold and italic appearance.",
        objectives: [
          "Use strong for important content and em for stress emphasis.",
          "Distinguish semantic strong and em from presentational bold and italic styling."
        ],
        explanation: [
          "The strong element marks content with strong importance, seriousness, or urgency relative to its surrounding text. The em element marks stress emphasis that can affect the meaning of a sentence. Browsers commonly render strong in bold and em in italics, but those default styles are not their definitions. Assistive technologies may expose the semantic distinction, and CSS can change the appearance without changing what the content means.",
          "The b and i elements are also valid, but they serve different purposes: b draws attention without conveying extra importance, while i represents text in an alternate voice or mood, such as a technical term or a phrase from another language. Do not select strong or em simply because their default rendering looks attractive. Nesting can express increased emphasis, but use only the amount that accurately reflects the passage's meaning."
        ],
        terminology: [
          { term: "strong", definition: "An element indicating that its content has strong importance or urgency." },
          { term: "em", definition: "An element indicating stress emphasis that can change the meaning of a sentence." },
          { term: "b", definition: "An element drawing attention to text without adding importance." },
          { term: "i", definition: "An element representing an alternate voice, mood, or conventionally italicized phrase." }
        ],
        syntax: "<strong>important</strong> · <em>stressed</em> · <b>attention</b> · <i>alternate voice</i>",
        codeExample: {
          code: "<p><strong>Warning:</strong> save your work.</p>\n<p>Please <em>only</em> change the heading.</p>\n<p>The term <i>mise en place</i> means preparation.</p>\n<p><b>New:</b> the guide has an index.</p>",
          lines: [
            "Creates a paragraph where strong marks the warning label as important.",
            "Uses em to stress “only” in the instruction.",
            "Uses i for a phrase in another language, then explains its meaning.",
            "Uses b to draw attention to “New” without implying strong importance."
          ],
          output: "A warning is marked important, a restriction is stressed, a foreign phrase uses alternate-voice semantics, and a label is highlighted without extra importance."
        },
        commonMistakes: [
          "Using strong whenever bold text is desired, without considering whether the text is important.",
          "Using em to italicize a phrase that is not actually stressed."
        ],
        bestPractices: [
          "Choose text elements by meaning and adjust their visual presentation with CSS when necessary.",
          "Use b and i only when their attention or alternate-voice semantics fit the content better than strong or em."
        ],
        exercise: {
          title: "Mark an Instruction Clearly",
          difficulty: "beginner",
          instructions: "Write a paragraph with an important label in strong and stress the word “before” in the instruction.",
          starterCode: "<!-- Add a paragraph with meaningful emphasis -->",
          requirements: [
            { type: "element-text", selector: "strong", text: "Important:" },
            { type: "element-text", selector: "em", text: "before" }
          ],
          hints: [
            "Place strong around the label, not the entire paragraph.",
            "Use em around just the word whose stress affects the instruction."
          ],
          solutionCode: "<p><strong>Important:</strong> Save your notes <em>before</em> closing the page.</p>",
          solutionExplanation: "Strong marks the important label; em marks the stress emphasis on the timing word."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element signals stress emphasis that may alter a sentence's meaning?",
            choices: [
              { id: "a", text: "em" },
              { id: "b", text: "hr" },
              { id: "c", text: "small" }
            ],
            correctChoiceId: "a",
            explanation: "Em represents stress emphasis; strong indicates importance or urgency."
          },
          {
            type: "true-false",
            prompt: "The only purpose of strong is to make text bold.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "Strong conveys semantic importance; bold styling is only a common default rendering."
          },
          {
            type: "code-output",
            prompt: "What meaning does <strong>Keep clear</strong> communicate?",
            choices: [
              { id: "a", text: "The instruction is strongly important" },
              { id: "b", text: "The text is a paragraph break" },
              { id: "c", text: "The text is user keyboard input" }
            ],
            correctChoiceId: "a",
            explanation: "Strong denotes importance or urgency for its content."
          }
        ],
        summary: "Strong conveys importance, em conveys stress emphasis, while b and i have other conventions. Choose them for meaning, not their default bold or italic styles."
      },
      {
        slug: "annotations-and-raised-text",
        title: "Mark, Small, Superscript, and Subscript",
        minutes: 15,
        introduction: "Some text needs annotation or a conventional typographic position. Explore mark, small, sup, and sub with examples that preserve their meaning.",
        objectives: [
          "Use mark for text highlighted as relevant in context and small for side comments.",
          "Represent superscript and subscript notation with sup and sub."
        ],
        explanation: [
          "The mark element identifies text that is highlighted because it is relevant in a particular context, such as a search result matching a query. It does not mean “make this text yellow”; a browser's default highlighting can be restyled with CSS. The small element represents side comments or fine print, such as a copyright notice, rather than arbitrary text that should merely look tiny. The intended meaning of the surrounding content determines whether either element is suitable.",
          "Sup and sub render content as superscript and subscript and are useful when those positions are part of a typographic convention, such as exponents, ordinal endings, or chemical formulas. They are not general-purpose tools for shifting text visually. For example, H<sub>2</sub>O uses a subscript number as part of the formula, while x<sup>2</sup> expresses a squared value. Do not confuse these elements with semantic emphasis: they describe the position and convention of their enclosed text."
        ],
        terminology: [
          { term: "mark", definition: "Text highlighted as relevant in the current context." },
          { term: "small", definition: "Side comments or fine print associated with the surrounding content." },
          { term: "sup", definition: "Text rendered above the baseline for superscript notation." },
          { term: "sub", definition: "Text rendered below the baseline for subscript notation." }
        ],
        syntax: "<mark>match</mark> · <small>fine print</small> · x<sup>2</sup> · H<sub>2</sub>O",
        codeExample: {
          code: "<p>Search match: <mark>river</mark></p>\n<p>Area: 12 m<sup>2</sup></p>\n<p>Water is H<sub>2</sub>O.</p>\n<small>Measurements are approximate.</small>",
          lines: [
            "Creates a paragraph that marks the matching search term as contextually relevant.",
            "Writes an area measurement with the exponent in superscript.",
            "Writes water's formula with the numeral in subscript.",
            "Adds an associated measurement note as fine print."
          ],
          output: "A highlighted search match, area written with a squared unit, a chemical formula, and a fine-print measurement note."
        },
        commonMistakes: [
          "Using mark just to obtain a yellow background, even when the text is not contextually relevant.",
          "Using sup or sub to position arbitrary decorative text instead of applying CSS."
        ],
        bestPractices: [
          "Use mark for contextual relevance and small for actual side comments or fine print.",
          "Use sup and sub when raised or lowered text is part of established notation, and preserve readable context."
        ],
        exercise: {
          title: "Annotate a Science Note",
          difficulty: "beginner",
          instructions: "Mark the search word, write the formula H2O with a subscript, and add a small note explaining that the example is simplified.",
          starterCode: "<!-- Add the annotation and formula -->",
          requirements: [
            { type: "element-text", selector: "mark", text: "water" },
            { type: "element-text", selector: "sub", text: "2" },
            { type: "element-exists", selector: "small" }
          ],
          hints: [
            "Use mark around the word water because it is the search match.",
            "In H2O the numeral belongs inside sub; put the note in small."
          ],
          solutionCode: "<p>Search match: <mark>water</mark></p>\n<p>Formula: H<sub>2</sub>O</p>\n<small>This is a simplified example.</small>",
          solutionExplanation: "Mark identifies contextually relevant search text, sub represents the chemical notation, and small marks the explanatory fine print."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element is appropriate for a search term highlighted as a current match?",
            choices: [
              { id: "a", text: "mark" },
              { id: "b", text: "sub" },
              { id: "c", text: "hr" }
            ],
            correctChoiceId: "a",
            explanation: "Mark represents text highlighted as relevant in its current context."
          },
          {
            type: "true-false",
            prompt: "The numeral in H₂O is conventionally represented with sub.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Chemical formula numerals are conventionally written as subscripts."
          },
          {
            type: "code-output",
            prompt: "In x<sup>2</sup>, how is 2 represented?",
            choices: [
              { id: "a", text: "As superscript notation" },
              { id: "b", text: "As a paragraph heading" },
              { id: "c", text: "As a page language value" }
            ],
            correctChoiceId: "a",
            explanation: "Sup places its content above the baseline for superscript notation."
          }
        ],
        summary: "Mark denotes contextual highlighting, small represents fine print, and sup/sub represent conventional raised or lowered notation."
      },
      {
        slug: "text-formatting-project",
        title: "Text Formatting Project",
        minutes: 22,
        introduction: "Bring text semantics together in a short field guide. Build an outline, use meaningful inline text elements, preserve a code sample, and include a quotation.",
        objectives: [
          "Combine headings, paragraphs, breaks, and thematic breaks into a readable document.",
          "Apply text semantics accurately across emphasis, notation, code, keyboard input, and quotations."
        ],
        explanation: [
          "A reliable text document begins with a clear outline: a page heading, section headings, and paragraphs that develop each topic. Add a br only when a line boundary is meaningful within the content, such as a two-line address; add an hr only where the topic changes. This structure lets people scan the page and understand its organization independently of color, font size, or other visual styling.",
          "Inline semantics communicate relationships that plain styling cannot: strong conveys importance, em marks stress, mark highlights contextual relevance, small identifies fine print, and sup or sub express conventional notation. Code identifies computer syntax, pre preserves its whitespace, and kbd identifies user input. Use q for a short inline quotation or blockquote for an extended passage; cite identifies a cited work's title. Quoted wording should be clearly distinguished from the writer's words and attributed when its source is known. Combining these elements carefully creates richer, more accessible text rather than a collection of decorative effects."
        ],
        terminology: [
          { term: "Text semantics", definition: "The meaning and role communicated by text elements, separate from their visual styling." },
          { term: "Inline element", definition: "An element that marks a phrase or other content within a larger block." },
          { term: "Thematic structure", definition: "The arrangement of topics and transitions communicated by headings and thematic breaks." },
          { term: "pre and code", definition: "Elements that preserve preformatted whitespace and identify programming text." },
          { term: "kbd", definition: "An element identifying keyboard input or a key sequence." },
          { term: "Quotation", definition: "Source wording represented inline with q or as an extended passage with blockquote." }
        ],
        syntax: "Combine section headings and paragraphs with inline semantic elements where their meanings apply.",
        codeExample: {
          code: "<h1>Field Guide</h1>\n<h2>Care</h2>\n<p><strong>Important:</strong> water <em>slowly</em>.</p>\n<p>For seedlings, use 2<sup>nd</sup> growth check.</p>\n<hr>\n<h2>Record</h2>\n<pre><code>moisture = \"even\"</code></pre>\n<p>Press <kbd>Enter</kbd> to save.</p>\n<blockquote>\n  <p>Observe before making changes.</p>\n  <cite>Garden Journal</cite>\n</blockquote>\n<p>The guide calls practice <q>a daily habit</q>.</p>",
          lines: [
            "Introduces the guide's main topic.",
            "Begins a care section.",
            "Marks an important instruction and stresses how to water.",
            "Uses a paragraph and superscript for the ordinal notation.",
            "Signals a thematic change between care and recordkeeping.",
            "Begins the recordkeeping section.",
            "Uses pre and code to preserve and identify a sample.",
            "Marks Enter as keyboard input.",
            "Begins an extended quotation.",
            "Contains the quoted advice in a paragraph.",
            "Identifies the cited work's title.",
            "Closes the extended quotation.",
            "Uses q for a short inline quotation."
          ],
          output: "A field guide with a clear outline, semantically emphasized instructions, a notation example, a code sample, keyboard guidance, and an attributed quotation."
        },
        commonMistakes: [
          "Adding emphasis elements without regard to their meaning just to make many phrases look different.",
          "Omitting a logical outline or using repeated line breaks to imitate paragraph and section structure."
        ],
        bestPractices: [
          "Review every element for semantic accuracy, then use CSS for any additional visual design.",
          "Keep examples concise, provide surrounding context, and attribute quoted material to its source when known."
        ],
        exercise: {
          title: "Create a Mini Field Guide",
          difficulty: "intermediate",
          instructions: "Write a compact field guide with one h1, one h2 section, an important instruction, an inline emphasized word, a code example, and a quoted tip with a cited title.",
          starterCode: "<!-- Build your mini field guide -->",
          requirements: [
            { type: "element-text", selector: "h1", text: "Field Guide" },
            { type: "element-exists", selector: "h2" },
            { type: "element-exists", selector: "strong" },
            { type: "element-exists", selector: "em" },
            { type: "element-exists", selector: "pre > code" },
            { type: "element-text", selector: "kbd", text: "Enter" },
            { type: "element-exists", selector: "blockquote cite" }
          ],
          hints: [
            "Use headings to name the guide and its section before adding supporting paragraphs.",
            "The code element belongs inside pre; use kbd for the key and cite for the quotation's work title."
          ],
          solutionCode: "<h1>Field Guide</h1>\n<h2>Daily Care</h2>\n<p><strong>Important:</strong> check the soil <em>before</em> watering.</p>\n<pre><code>soil = \"slightly moist\"</code></pre>\n<p>Press <kbd>Enter</kbd> to save.</p>\n<blockquote>\n  <p>Observe carefully and adjust one thing at a time.</p>\n  <cite>Garden Journal</cite>\n</blockquote>\n<p>The guide calls this <q>steady practice</q>.</p>",
          solutionExplanation: "The guide starts with a meaningful heading hierarchy. Strong marks importance, em adds stress emphasis, pre/code presents a code sample, kbd identifies a key, blockquote/cite distinguishes an attributed extended quotation, and q marks an inline quotation."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element should mark the important instruction in a field guide?",
            choices: [
              { id: "a", text: "strong" },
              { id: "b", text: "br" },
              { id: "c", text: "sub" }
            ],
            correctChoiceId: "a",
            explanation: "Strong communicates strong importance; br is a line break and sub is subscript."
          },
          {
            type: "true-false",
            prompt: "A well-structured text project should use heading levels to communicate topic hierarchy.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Headings create an outline that helps readers understand and navigate the document."
          },
          {
            type: "code-output",
            prompt: "What role does cite play in <blockquote><p>Advice</p><cite>Field Notes</cite></blockquote>?",
            choices: [
              { id: "a", text: "It identifies the title of the cited work" },
              { id: "b", text: "It creates a navigation menu" },
              { id: "c", text: "It renders a keyboard key" }
            ],
            correctChoiceId: "a",
            explanation: "Cite identifies a creative work's title, such as the source title for the quotation."
          }
        ],
        summary: "A good text project combines a logical outline with only the semantic text elements that fit the content. Meaning comes from HTML; appearance can be styled separately."
      }
    ]
  },
  {
    slug: "links-and-navigation",
    title: "Links and Navigation",
    summary: "Create useful links to pages and page sections, explain link purpose, and handle external destinations safely.",
    objectives: [
      "Create descriptive links with the anchor element and appropriate href values.",
      "Use relative paths, fragment identifiers, and safe external-link practices."
    ],
    lessons: [
      {
        slug: "creating-descriptive-links",
        title: "Creating Descriptive Links",
        minutes: 16,
        introduction: "Links connect documents and resources. Learn the anchor element, write useful link text, and choose a destination that matches the reader's expectation.",
        objectives: [
          "Create an anchor element with a working href and descriptive link text.",
          "Choose a relative URL for a nearby page and understand when an absolute URL is appropriate."
        ],
        explanation: [
          "The a element creates a hyperlink when it has an href attribute. The href value names the destination, while the content between the tags gives the reader a link label. That label should make sense out of context—for example, “Read the planting guide” is more useful than “click here.” Screen-reader users often navigate by listing links, so the label should reveal where the link leads without depending on nearby visual cues.",
          "A relative URL points to a resource in relation to the current document, such as guides/plants.html or ../index.html. It is convenient for pages in the same site, but its meaning depends on the current file's location. An absolute URL includes a scheme and host, such as https://example.org/guide, and is suitable for a specific external destination. Link to the safest, most direct destination and avoid confusing URL forms or unnecessary redirects."
        ],
        terminology: [
          { term: "Anchor", definition: "The a element, which creates a hyperlink when it has an href." },
          { term: "href", definition: "The attribute that specifies a link's destination." },
          { term: "Relative URL", definition: "A destination path interpreted relative to the current document's location." },
          { term: "Link purpose", definition: "The destination or action a user can infer from the link and its context." }
        ],
        syntax: '<a href="destination">descriptive link text</a>',
        codeExample: {
          code: '<p>Explore the <a href="guides/plants.html">planting guide</a>.</p>\n<p>Read the <a href="https://example.org/terms">site terms</a>.</p>',
          lines: [
            "Creates a paragraph with a descriptive link to a nearby guide at a relative path.",
            "Creates a paragraph with a descriptive link to an external HTTPS destination."
          ],
          output: "Two descriptive links: one to a nearby guide and one to an external terms page."
        },
        commonMistakes: [
          "Using vague link text such as “here” when the destination is not clear from its context.",
          "Writing a relative path as if it were rooted at the site when it is actually relative to the current page."
        ],
        bestPractices: [
          "Write concise link text that communicates the destination or action even when read in a list of links.",
          "Use HTTPS for external destinations, verify relative paths from the current file, and test that each link resolves."
        ],
        exercise: {
          title: "Link a Helpful Guide",
          difficulty: "beginner",
          instructions: "Add a descriptive link to the local page guides/growing.html and an external HTTPS link to the resource directory.",
          starterCode: "<!-- Add two resource links -->",
          requirements: [
            { type: "attribute-equals", selector: 'a[href="guides/growing.html"]', attribute: "href", value: "guides/growing.html" },
            { type: "element-text", selector: 'a[href="guides/growing.html"]', text: "Read the growing guide" },
            { type: "attribute-equals", selector: 'a[href="https://example.org/resources"]', attribute: "href", value: "https://example.org/resources" }
          ],
          hints: [
            "Put the destination in href and descriptive wording between the anchor tags.",
            "An external URL should include the https:// scheme."
          ],
          solutionCode: '<p><a href="guides/growing.html">Read the growing guide</a></p>\n<p><a href="https://example.org/resources">Browse the resource directory</a></p>',
          solutionExplanation: "Each anchor has a destination in href and link text that describes its resource. The local path is relative, and the external destination uses HTTPS."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which attribute specifies where an anchor link goes?",
            choices: [
              { id: "a", text: "href" },
              { id: "b", text: "lang" },
              { id: "c", text: "charset" }
            ],
            correctChoiceId: "a",
            explanation: "Href gives an anchor its destination URL."
          },
          {
            type: "true-false",
            prompt: "The link text “Read the growing guide” gives more information than “click here.”",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Descriptive link text communicates the destination when encountered out of context."
          },
          {
            type: "code-output",
            prompt: "In <a href=\"notes.html\">Notes</a>, what is the destination?",
            choices: [
              { id: "a", text: "notes.html relative to the current document" },
              { id: "b", text: "The page title Notes" },
              { id: "c", text: "An email address" }
            ],
            correctChoiceId: "a",
            explanation: "The href value is a relative path to notes.html."
          }
        ],
        summary: "Anchors with href connect resources. Use clear labels, test relative paths in their document context, and prefer HTTPS for external links."
      },
      {
        slug: "page-fragments-and-external-links",
        title: "Page Sections and External Link Safety",
        minutes: 17,
        introduction: "A link can jump to an identified section or open a separate browsing context. Learn fragment identifiers and safer practices for new tabs.",
        objectives: [
          "Link to an element by matching a fragment in href to its id.",
          "Use target and rel appropriately when a link opens a new tab."
        ],
        explanation: [
          "A fragment identifier lets a link navigate to a particular element in a document. Give the destination a unique id, then use an href beginning with # followed by that exact id. For example, href=\"#contact\" targets id=\"contact\" in the same page; another-page fragment can combine a path and fragment. IDs must be unique within the document, and the spelling and capitalization of the fragment must match the target identifier.",
          "The target=\"_blank\" value asks the browser to open a link in a new browsing context, often a new tab. Do not use it casually: unexpected new tabs can disrupt navigation and assistive-technology workflows. When opening a new tab is needed, include rel=\"noopener\" to prevent the new page from receiving a scripting reference to the opener; noreferrer can also suppress referrer information and implies noopener in modern browsers. Make the new-tab behavior apparent in the link's context."
        ],
        terminology: [
          { term: "Fragment identifier", definition: "A URL suffix beginning with # that points to an element's id." },
          { term: "id", definition: "A unique identifier for one element within a document." },
          { term: "target", definition: "An anchor attribute that selects the browsing context for a destination." },
          { term: "noopener", definition: "A rel value that prevents a newly opened page from controlling its opener." }
        ],
        syntax: '<a href="#section-id">Jump to section</a> · <a target="_blank" rel="noopener" href="...">',
        codeExample: {
          code: '<nav><a href="#contact">Contact details</a></nav>\n<main>\n  <h2 id="contact">Contact</h2>\n  <p>Send a message to the team.</p>\n  <a href="https://example.org/help" target="_blank" rel="noopener">Open external help (new tab)</a>\n</main>',
          lines: [
            "Creates a navigation group linking to the contact fragment.",
            "Begins the main content region.",
            "Creates the fragment's destination heading with the matching id.",
            "Adds content at that destination.",
            "Links to external help in a new tab and uses noopener protection.",
            "Closes the main content region."
          ],
          output: "A navigation link jumps to the Contact heading; the external help link opens separately and includes rel=noopener."
        },
        commonMistakes: [
          "Using a fragment name that does not exactly match the destination element's id.",
          "Setting target=\"_blank\" without considering user expectations or adding an appropriate rel protection."
        ],
        bestPractices: [
          "Use unique, meaningful ids and verify every fragment link reaches its intended section.",
          "Open a new tab only when useful, disclose the behavior, and use rel=\"noopener\"."
        ],
        exercise: {
          title: "Create a Section Jump and Safe External Link",
          difficulty: "intermediate",
          instructions: "Add a same-page link to an FAQ heading. Also add an external help link that opens a new tab safely and says so in its label.",
          starterCode: "<!-- Add the fragment and external links -->",
          requirements: [
            { type: "attribute-equals", selector: 'a[href="#faq"]', attribute: "href", value: "#faq" },
            { type: "attribute-equals", selector: 'h2[id="faq"]', attribute: "id", value: "faq" },
            { type: "attribute-equals", selector: 'a[href="https://example.org/help"]', attribute: "target", value: "_blank" },
            { type: "attribute-equals", selector: 'a[href="https://example.org/help"]', attribute: "rel", value: "noopener" }
          ],
          hints: [
            "The fragment after # must match the heading's id exactly.",
            "For a new tab, pair target=\"_blank\" with rel=\"noopener\" and make the behavior clear."
          ],
          solutionCode: '<p><a href="#faq">Jump to FAQs</a></p>\n<h2 id="faq">Frequently asked questions</h2>\n<a href="https://example.org/help" target="_blank" rel="noopener">Open help in a new tab</a>',
          solutionExplanation: "The fragment link and heading share the faq identifier. The external link uses HTTPS, clearly announces its new-tab behavior, and protects the opener."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "What must match for href=\"#details\" to reach its target?",
            choices: [
              { id: "a", text: 'An element with id="details"' },
              { id: "b", text: 'An element with class="details"' },
              { id: "c", text: "A title element named details" }
            ],
            correctChoiceId: "a",
            explanation: "A fragment identifier targets an element whose id matches the fragment."
          },
          {
            type: "true-false",
            prompt: "When a link uses target=\"_blank\", rel=\"noopener\" helps prevent the new page from controlling its opener.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "Noopener prevents the opened browsing context from accessing the opener through the relevant scripting relationship."
          },
          {
            type: "code-output",
            prompt: "What does href=\"#faq\" normally do when an element has id=\"faq\"?",
            choices: [
              { id: "a", text: "Jumps to that element in the current document" },
              { id: "b", text: "Opens a new window by itself" },
              { id: "c", text: "Changes the page language" }
            ],
            correctChoiceId: "a",
            explanation: "A fragment link navigates to the matching id in the current page."
          }
        ],
        summary: "Use matching unique id and fragment values for in-page navigation. If a link opens a new tab, do so intentionally, disclose it, and include noopener."
      }
    ]
  },
  {
    slug: "images-and-graphics",
    title: "Images and Graphics",
    summary: "Embed images with appropriate alternative text, use decorative images accessibly, and select responsive image sources when needed.",
    objectives: [
      "Use img with a valid source and an alternative that matches the image's purpose.",
      "Distinguish informative, decorative, and functional images and apply safe, responsive practices."
    ],
    lessons: [
      {
        slug: "images-and-alt-text",
        title: "Images and Alternative Text",
        minutes: 18,
        introduction: "The img element embeds an image, while alt text communicates its useful content or purpose when it cannot be seen. Learn how to write an effective alternative.",
        objectives: [
          "Add an img element with a source and an appropriate alt attribute.",
          "Write concise alternatives that describe an image's purpose in context."
        ],
        explanation: [
          "The img element is a void element. Its src attribute identifies the image resource and its alt attribute supplies a text alternative. Alternative text is read by assistive technologies and can appear when an image fails to load, so it should convey the information or function that the image contributes to the page. A concise description is usually more helpful than listing every visible detail, and the right wording depends on the surrounding content rather than the image alone.",
          "For an informative image, describe the relevant information; for an image that is the only content of a link or button, describe the action or destination. A purely decorative image that adds no information should usually use alt=\"\" so assistive technology can skip it. Do not omit alt, because missing alt can cause the file name to be announced. Avoid redundant phrases such as “image of” unless the image type itself matters."
        ],
        terminology: [
          { term: "img", definition: "A void element that embeds an image resource in a document." },
          { term: "src", definition: "The attribute that supplies an image's resource URL." },
          { term: "alt text", definition: "A text alternative conveying the information or purpose of an image." },
          { term: "Decorative image", definition: "An image that contributes no meaningful information beyond nearby content." }
        ],
        syntax: '<img src="image-file.jpg" alt="Concise, context-aware description">',
        codeExample: {
          code: '<img src="assets/harbor.jpg" alt="Fishing boats moored in the harbor at sunrise">\n<img src="assets/leaf-divider.svg" alt="">',
          lines: [
            "Embeds an informative harbor photograph with a contextually useful alternative.",
            "Embeds a decorative divider with an empty alternative so it can be skipped."
          ],
          output: "An informative harbor photograph has a descriptive alternative; the decorative divider is omitted from the accessibility reading order."
        },
        commonMistakes: [
          "Omitting alt entirely or using an unhelpful file name as the alternative.",
          "Writing verbose visual inventories that repeat nearby text instead of conveying the image's purpose."
        ],
        bestPractices: [
          "Write alt text based on the image's role and surrounding context, not a fixed formula.",
          "Use alt=\"\" for genuinely decorative images and meaningful text alternatives for informative or functional images."
        ],
        exercise: {
          title: "Describe an Informative Image",
          difficulty: "beginner",
          instructions: "Embed the park image with the provided path and describe what is relevant about it. Add a decorative divider image with an empty alternative.",
          starterCode: "<!-- Add two images with appropriate alternatives -->",
          requirements: [
            { type: "attribute-equals", selector: 'img[src="images/park.jpg"]', attribute: "alt", value: "A tree-lined path through the park" },
            { type: "attribute-equals", selector: 'img[src="images/divider.svg"]', attribute: "alt", value: "" }
          ],
          hints: [
            "Every img needs an alt attribute, even when the value is intentionally empty.",
            "Describe the park image's useful content; don't repeat “image of” unnecessarily."
          ],
          solutionCode: '<img src="images/park.jpg" alt="A tree-lined path through the park">\n<img src="images/divider.svg" alt="">',
          solutionExplanation: "The park photograph conveys information and receives a concise description. The divider is decorative, so an empty alternative lets assistive technology ignore it."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "What should a decorative image with no informational role usually use for alt?",
            choices: [
              { id: "a", text: 'An empty value: alt=""' },
              { id: "b", text: "No alt attribute" },
              { id: "c", text: "The image's entire file path" }
            ],
            correctChoiceId: "a",
            explanation: "An empty alt tells assistive technology that the decorative image can be skipped."
          },
          {
            type: "true-false",
            prompt: "The alt text for a functional image should convey the function or destination of that image.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "true",
            explanation: "When an image acts as a control or link, its alternative should communicate the action or destination."
          },
          {
            type: "code-output",
            prompt: "Which attribute points to the image file in <img src=\"map.png\" alt=\"Trail map\">?",
            choices: [
              { id: "a", text: "src" },
              { id: "b", text: "alt" },
              { id: "c", text: "id" }
            ],
            correctChoiceId: "a",
            explanation: "Src identifies the resource; alt provides its text alternative."
          }
        ],
        summary: "Img embeds a resource; src locates it and alt communicates its information or purpose. Use concise contextual alternatives, including an empty value for decorative images."
      },
      {
        slug: "responsive-images-and-figures",
        title: "Responsive Images and Figures",
        minutes: 18,
        introduction: "Images can adapt to different screens and be presented with captions. Learn a simple responsive sizing rule and the figure/figcaption relationship.",
        objectives: [
          "Group a self-contained image with its caption using figure and figcaption.",
          "Explain how responsive CSS sizing can keep an image within its container."
        ],
        explanation: [
          "The figure element groups self-contained content, such as an image or diagram, with an optional figcaption that gives it a caption. A figure is not limited to pictures: it can also contain a chart or code excerpt. The caption should explain or identify the figure in context. The image still needs an appropriate alt alternative; a caption and alt are not interchangeable because a caption is visible to everyone while alt supports access to the image's information when it cannot be seen.",
          "A large image can overflow a narrow viewport unless its presentation is responsive. A common CSS rule is max-width: 100%; height: auto; which limits the image to its containing block and preserves its proportions. For different crops or resolutions, HTML also provides picture and srcset patterns, but choosing among sources should preserve the same essential information and alternatives. Ensure image files are trustworthy, avoid embedding unexpected executable content, and prefer secure HTTPS URLs when loading resources from another site."
        ],
        terminology: [
          { term: "figure", definition: "A self-contained item that can be referenced independently from the main flow." },
          { term: "figcaption", definition: "A caption that labels or explains the content of its figure." },
          { term: "Responsive image", definition: "An image whose displayed size or selected resource adapts to the available viewing conditions." },
          { term: "Intrinsic ratio", definition: "The original width-to-height proportion of an image." }
        ],
        syntax: "<figure><img ...><figcaption>Caption</figcaption></figure>",
        codeExample: {
          code: '<figure>\n  <img src="images/fern.jpg" alt="A fern unfurling beside a shaded trail">\n  <figcaption>A young fern growing in the shade.</figcaption>\n</figure>\n<style>\n  img { max-width: 100%; height: auto; }\n</style>',
          lines: [
            "Begins a self-contained image-and-caption group.",
            "Embeds a fern photograph with informative alternative text.",
            "Adds the visible caption associated with the image.",
            "Closes the figure group.",
            "Begins a CSS style block for this concise example.",
            "Limits images to their container and preserves their natural proportions.",
            "Closes the style block."
          ],
          output: "A figure containing an accessible fern image and caption; CSS prevents the image from exceeding its container while preserving its proportions."
        },
        commonMistakes: [
          "Using the visible caption as a reason to omit the image's alt attribute.",
          "Constraining an image's width and height independently so it becomes distorted."
        ],
        bestPractices: [
          "Use figure and figcaption when an image and caption form a self-contained unit; keep alt useful and concise.",
          "Constrain responsive images without distorting their proportions and test the layout at narrow widths."
        ],
        exercise: {
          title: "Caption a Responsive Diagram",
          difficulty: "intermediate",
          instructions: "Create a figure containing a diagram with a meaningful alt alternative and a figcaption. Add CSS so images fit their container without distortion.",
          starterCode: "<!-- Add a figure, caption, and responsive image rule -->",
          requirements: [
            { type: "element-exists", selector: "figure > img" },
            { type: "element-text", selector: "figcaption", text: "Steps in the water cycle." },
            { type: "attribute-equals", selector: "img", attribute: "alt", value: "Diagram showing evaporation, condensation, and precipitation" }
          ],
          hints: [
            "Nest the image and caption inside figure; figcaption provides visible context.",
            "Use max-width: 100% and height: auto to preserve the image's ratio."
          ],
          solutionCode: '<figure>\n  <img src="images/water-cycle.png" alt="Diagram showing evaporation, condensation, and precipitation">\n  <figcaption>Steps in the water cycle.</figcaption>\n</figure>\n<style>\n  img { max-width: 100%; height: auto; }\n</style>',
          solutionExplanation: "The figure groups a self-contained diagram with its caption. Alt provides a text alternative, and the CSS rule scales the image down without changing its proportions."
        },
        quiz: [
          {
            type: "multiple-choice",
            prompt: "Which element supplies a visible caption for a figure?",
            choices: [
              { id: "a", text: "figcaption" },
              { id: "b", text: "kbd" },
              { id: "c", text: "title" }
            ],
            correctChoiceId: "a",
            explanation: "Figcaption labels or explains the content grouped by figure."
          },
          {
            type: "true-false",
            prompt: "A visible figcaption makes an alt attribute unnecessary.",
            choices: [
              { id: "true", text: "True" },
              { id: "false", text: "False" }
            ],
            correctChoiceId: "false",
            explanation: "The caption is not a replacement for the image's text alternative; each serves a different audience and context."
          },
          {
            type: "code-output",
            prompt: "What does max-width: 100%; height: auto; help achieve for an image?",
            choices: [
              { id: "a", text: "It fits within its container while preserving proportions" },
              { id: "b", text: "It automatically writes alt text" },
              { id: "c", text: "It opens the image in a new tab" }
            ],
            correctChoiceId: "a",
            explanation: "The width cap prevents overflow and automatic height maintains the intrinsic ratio."
          }
        ],
        summary: "Figure and figcaption group self-contained media and its visible caption. Keep alt text, and use responsive sizing that preserves image proportions."
      }
    ]
  }
];

const addedLesson = (spec) => ({
  slug: spec.slug,
  title: spec.title,
  minutes: spec.minutes || 13,
  introduction: `${spec.title} is an essential HTML skill for ${spec.purpose}. This lesson explains the underlying structure, shows a concrete pattern, and applies it in a focused exercise.`,
  objectives: [
    `Explain how ${spec.term} communicates ${spec.purpose}.`,
    `Create valid markup using this pattern: ${spec.mechanic}`,
    `Recognize and prevent this common issue: ${spec.pitfall}`
  ],
  explanation: [
    `${spec.title} helps authors create documents that communicate ${spec.purpose}. ${spec.mechanic} The browser parses this markup into a document structure; people and assistive technologies can then use the relationships and meaning expressed by the elements. ${spec.practice} Understanding the purpose of the markup is more durable than memorizing a visual result, because default appearance can differ between browsers and can be changed by CSS without changing HTML semantics.`,
    `A reliable author starts with the information the reader needs and chooses elements and attributes that express that relationship directly. ${spec.pitfall} ${spec.practice} Check both the source and its rendered result, including whether the content remains understandable without styling. Use valid nesting, meaningful text, and only attributes supported by the chosen element. This approach makes pages easier to maintain and gives browsers and assistive technology the information needed to present the content consistently.`
  ],
  terminology: [
    { term: spec.term, definition: spec.definition },
    { term: "Semantic HTML", definition: "Markup whose elements express the role and relationships of content independently of its visual styling." },
    { term: "DOM", definition: "The browser's structured representation of a parsed HTML document and its element relationships." }
  ],
  syntax: spec.syntax,
  codeExample: {
    code: spec.example,
    lines: spec.exampleLines || spec.example.split("\n").map((line, index) => `Line ${index + 1}: ${index === 0 ? spec.exampleExplanation : "Continues the same concise HTML example."}`),
    output: spec.output
  },
  commonMistakes: [
    spec.pitfall,
    `Selecting markup only for its default appearance can hide the intended ${spec.term.toLowerCase()} meaning.`,
    "Omitting relevant text, context, or a supported attribute can make the result ambiguous or unusable."
  ],
  bestPractices: [
    spec.practice,
    "Use native HTML semantics, valid nesting, and descriptive content before considering visual styling.",
    "Verify the finished fragment in a browser and check that its meaning is clear without CSS."
  ],
  exercise: {
    title: spec.exerciseTitle || `Practice ${spec.title.toLowerCase()}`,
    difficulty: spec.difficulty || "beginner",
    instructions: spec.exerciseInstructions || `Extend the starter fragment to demonstrate ${spec.title.toLowerCase()} in a realistic example. Use the appropriate native HTML, include the required content, and keep the result understandable without CSS.`,
    starterCode: "<!-- Add the requested HTML fragment -->",
    requirements: spec.requirements || [{ type: "element-exists", selector: spec.selector }],
    hints: [
      `Start with the content relationship, then apply the native HTML pattern: ${spec.mechanic}`,
      `Compare your markup with the example and verify that ${spec.selector} appears with the intended meaning.`
    ],
    solutionCode: spec.solutionCode || spec.example,
    solutionExplanation: spec.solutionExplanation || `The solution uses ${spec.selector} to express ${spec.purpose} directly in HTML. Its content is kept in logical order and uses the native semantics browsers and assistive technologies expect. The approach avoids visual-only substitutions, so the document remains meaningful when styles are unavailable.`
  },
  quiz: [
    {
      type: "multiple-choice",
      prompt: spec.question || `Which statement best describes ${spec.term}?`,
      choices: [
        { id: "a", text: spec.answer || spec.definition },
        { id: "b", text: spec.wrongAnswer || "It is only a visual styling instruction with no document meaning." },
        { id: "c", text: "It replaces the need for valid HTML structure." }
      ],
      correctChoiceId: "a",
      explanation: spec.questionExplanation || `${spec.term} communicates ${spec.purpose}; it is not merely a visual effect.`
    },
    {
      type: "true-false",
      prompt: spec.truth || `${spec.term} should be chosen according to its meaning and role in the document.`,
      choices: [
        { id: "true", text: "True" },
        { id: "false", text: "False" }
      ],
      correctChoiceId: spec.truthCorrect === false ? "false" : "true",
      explanation: spec.truthExplanation || `${spec.practice}`
    },
    {
      type: "code-output",
      prompt: `In this example, what does the HTML communicate?\n${spec.example}`,
      choices: [
        { id: "a", text: spec.output },
        { id: "b", text: spec.outputWrong || "It creates no document content because HTML requires JavaScript." },
        { id: "c", text: "It turns the fragment into an unrelated CSS rule." }
      ],
      correctChoiceId: "a",
      explanation: spec.outputExplanation || `${spec.exampleExplanation} ${spec.output}`
    }
  ],
  summary: `${spec.title} uses ${spec.term} to communicate ${spec.purpose}. ${spec.practice}`
});

const modules = module.exports;
const moduleBySlug = (slug) => modules.find((module) => module.slug === slug);

moduleBySlug("introduction-to-html").lessons.push(
  addedLesson({
    slug: "html-elements-and-tags",
    title: "HTML Elements and Tags",
    purpose: "recognizable units of content such as headings, paragraphs, and links",
    term: "Element",
    definition: "A structural unit in an HTML document, usually consisting of a start tag, content, and an end tag.",
    mechanic: "Pair the opening and closing tags around the content that belongs to the element.",
    pitfall: "Confusing a tag's spelling with the entire element, including its content and descendants.",
    practice: "Match each opening tag with its corresponding closing tag and place only related content inside the element.",
    syntax: "<p>Related sentence.</p>",
    example: "<article><h2>Field Notes</h2><p>Observations from the trail.</p></article>",
    exampleExplanation: "An article contains a heading and a paragraph as related content.",
    output: "A self-contained article section with a heading and an observations paragraph.",
    selector: "article > p",
    solutionCode: "<article><h2>Field Notes</h2><p>Observations from the trail.</p></article>"
  }),
  addedLesson({
    slug: "nesting-and-document-trees",
    title: "Nesting Elements and the Document Tree",
    purpose: "parent, child, and sibling relationships in a document",
    term: "Nesting",
    definition: "Placing an element between the opening and closing tags of another element.",
    mechanic: "Close a nested child before closing its parent element.",
    pitfall: "Crossing tag boundaries, such as opening one element inside another but closing them in the wrong order.",
    practice: "Indent children consistently and make the nesting order visible in source code.",
    syntax: "<parent><child>Content</child></parent>",
    example: "<section><h2>Trail</h2><p>Follow the marked path.</p></section>",
    exampleExplanation: "The heading and paragraph are children of the section and siblings of one another.",
    output: "A section element containing a heading followed by a paragraph.",
    selector: "section > h2",
    solutionCode: "<section><h2>Trail</h2><p>Follow the marked path.</p></section>"
  }),
  addedLesson({
    slug: "void-elements",
    title: "Void Elements",
    purpose: "content that is embedded or inserted without a closing tag",
    term: "Void element",
    definition: "An HTML element that cannot contain child content and therefore has no end tag.",
    mechanic: "Write elements such as br and img with their supported attributes but without closing tags.",
    pitfall: "Adding an end tag to a void element or treating it as a container for text.",
    practice: "Check whether an element is void before writing its closing tag; use valid HTML syntax rather than XHTML-style assumptions.",
    syntax: "<br> · <img src=\"...\" alt=\"...\">",
    example: "<p>Line one<br>Line two</p>",
    exampleExplanation: "The br void element inserts a line break between two pieces of paragraph content.",
    output: "One paragraph displayed on two content lines.",
    selector: "p br",
    solutionCode: "<p>North entrance<br>Open until dusk</p>"
  }),
  addedLesson({
    slug: "html-attributes",
    title: "Writing HTML Attributes",
    purpose: "element-specific information such as a destination, language, or image resource",
    term: "Attribute",
    definition: "A name-value setting written in an element's start tag.",
    mechanic: "Place a supported attribute and quoted value before the start tag's closing angle bracket.",
    pitfall: "Writing an attribute outside the start tag or applying an unrelated attribute to an element.",
    practice: "Use quoted values consistently and confirm that each attribute belongs to the element it configures.",
    syntax: '<element name="value">Content</element>',
    example: '<p lang="en">A welcome message.</p>',
    exampleExplanation: "The paragraph's lang attribute identifies the language of its content.",
    output: "A paragraph whose content is identified as English.",
    selector: "p",
    requirements: [{ type: "attribute-equals", selector: "p", attribute: "lang", value: "en" }],
    solutionCode: '<p lang="en">Welcome to the course.</p>'
  }),
  addedLesson({
    slug: "html-comments",
    title: "HTML Comments",
    purpose: "source notes for people maintaining a document",
    term: "Comment",
    definition: "A source-code annotation delimited by <!-- and --> that is not rendered as page text.",
    mechanic: "Use a short comment to clarify an implementation decision, then close it with -->.",
    pitfall: "Putting sensitive information in a comment or forgetting the closing delimiter.",
    practice: "Write comments for maintainers only; anything private must never be shipped in public HTML source.",
    syntax: "<!-- A concise source note -->",
    example: "<!-- Contact details are reviewed each season -->\n<p>Contact the visitor center for current hours.</p>",
    exampleLines: ["A source-only comment records when contact details need review.", "A visible paragraph tells readers how to find current hours."],
    exampleExplanation: "The comment is a source note; the paragraph is the content displayed to readers.",
    output: "Readers see the visitor-center sentence, while the HTML source retains a maintenance note.",
    selector: "p",
    solutionCode: "<!-- Update this notice when hours change -->\n<p>Contact the visitor center for current hours.</p>"
  }),
  addedLesson({
    slug: "html-whitespace-and-entities",
    title: "Whitespace and Character References",
    purpose: "readable source formatting and literal characters that have special meaning in markup",
    term: "Character reference",
    definition: "A written reference such as &amp; or &lt; that represents a character in HTML text.",
    mechanic: "Use a named or numeric character reference when a literal character would be parsed as markup.",
    pitfall: "Typing a raw less-than sign where HTML expects a tag or assuming source line breaks always create visible breaks.",
    practice: "Use entities for reserved characters and use semantic elements, not repeated spaces, to structure content.",
    syntax: "&amp; represents &nbsp; &lt; represents <",
    example: "<p>Use &lt; and &gt; to show angle brackets; research &amp; notes.</p>",
    exampleExplanation: "Character references display the reserved angle brackets and ampersand as text.",
    output: "The paragraph visibly contains “Use < and > to show angle brackets; research & notes.”",
    selector: "p",
    solutionCode: "<p>Write 3 &lt; 5 and use tea &amp; honey.</p>"
  }),
  addedLesson({
    slug: "html-element-case",
    title: "Element Names and Consistent HTML",
    purpose: "readable, predictable markup that follows modern HTML authoring conventions",
    term: "Element name",
    definition: "The name identifying the kind of HTML element, such as p, main, or figure.",
    mechanic: "Use standard element names in lowercase and preserve the documented spelling.",
    pitfall: "Inventing element names or mixing capitalization styles in a way that makes source difficult to review.",
    practice: "Use lowercase HTML element names, consistent indentation, and an editor or validator to catch misspellings.",
    syntax: "<main><p>Content</p></main>",
    example: "<main><h1>Research Log</h1><p>Entry one.</p></main>",
    exampleExplanation: "Standard lowercase element names identify the main region, heading, and paragraph.",
    output: "A main content region containing a heading and a paragraph.",
    selector: "main h1",
    solutionCode: "<main><h1>Research Log</h1><p>Entry one.</p></main>"
  }),
  addedLesson({
    slug: "html-and-the-web",
    title: "HTML in a Web Page",
    purpose: "cooperation between document structure, presentation, and behavior",
    term: "Web standard",
    definition: "A documented convention that helps browsers and authors interpret web content consistently.",
    mechanic: "Use HTML for content structure, CSS for presentation, and JavaScript for interactive behavior.",
    pitfall: "Expecting HTML alone to define every visual detail or application behavior.",
    practice: "Keep structural meaning in HTML and add styling or scripting only when the page requires it.",
    syntax: "<h1>Structure</h1> + CSS presentation + optional JavaScript behavior",
    example: "<h1>Weather report</h1><p>Rain is expected this afternoon.</p>",
    exampleExplanation: "HTML identifies the heading and report text; styling and behavior are separate concerns.",
    output: "A document with a top-level heading and a weather-report paragraph.",
    selector: "h1",
    solutionCode: "<h1>Weather report</h1><p>Rain is expected this afternoon.</p>"
  })
);

const introductionModule = moduleBySlug("introduction-to-html");
const originalHtmlLesson = introductionModule.lessons.find((lesson) => lesson.slug === "what-html-is");
const originalAttributesLesson = introductionModule.lessons.find((lesson) => lesson.slug === "elements-attributes-and-text");
originalHtmlLesson.title = "What is HTML?";
originalAttributesLesson.title = "Attributes and values";
introductionModule.lessons = [
  originalHtmlLesson,
  addedLesson({
    slug: "what-is-html5",
    title: "What is HTML5?",
    purpose: "modern interoperable markup for web documents",
    term: "HTML5",
    definition: "The modern evolution of HTML, including the current standard's elements, APIs, and parsing rules.",
    mechanic: "Write current HTML elements and use the modern doctype rather than obsolete presentation tags.",
    pitfall: "Assuming HTML5 is a separate file format or using outdated tags such as font for presentation.",
    practice: "Follow current HTML standards and use semantic elements; check feature support when relying on newer browser APIs.",
    syntax: "<!doctype html>",
    example: "<!doctype html><main><h1>Modern HTML</h1><p>Use semantic markup.</p></main>",
    exampleExplanation: "A modern document uses the concise HTML doctype and semantic content elements.",
    output: "A modern HTML fragment with a main region, heading, and paragraph.",
    selector: "main",
    solutionCode: "<!doctype html><main><h1>Modern HTML</h1><p>Use semantic markup.</p></main>"
  }),
  addedLesson({
    slug: "how-websites-work",
    title: "How websites work",
    purpose: "the request, response, and rendering steps that deliver web pages",
    term: "HTTP request",
    definition: "A message a browser sends to request a resource from a web server.",
    mechanic: "The browser requests a URL, receives HTML and related resources, then parses and renders the response.",
    pitfall: "Thinking a browser displays the HTML source without first requesting and interpreting the document.",
    practice: "Distinguish a page's HTML structure from the server, network, browser, and other resources involved in delivery.",
    syntax: "Browser → HTTP request → server response → HTML parsing and rendering",
    example: "<h1>Welcome</h1><p>The browser renders this response as page content.</p>",
    exampleExplanation: "The browser parses the returned HTML and presents its heading and paragraph.",
    output: "A rendered welcome heading followed by explanatory page text.",
    selector: "h1",
    solutionCode: "<h1>Welcome</h1><p>The browser renders this response as page content.</p>"
  }),
  addedLesson({
    slug: "html-css-javascript",
    title: "HTML vs CSS vs JavaScript",
    purpose: "separation between document structure, presentation, and behavior",
    term: "Separation of concerns",
    definition: "Organizing structure, visual presentation, and interactive behavior as distinct responsibilities.",
    mechanic: "Use HTML for meaning, CSS for appearance, and JavaScript for behavior.",
    pitfall: "Choosing a semantic HTML element only because its default style looks convenient.",
    practice: "Keep content structure in HTML and add CSS or JavaScript for their respective purposes.",
    syntax: "HTML = structure · CSS = presentation · JavaScript = behavior",
    example: "<button type=\"button\">Show details</button>",
    exampleExplanation: "HTML provides a native button and its label; styles and interaction can be added separately.",
    output: "A button control labeled “Show details.”",
    selector: "button",
    solutionCode: "<button type=\"button\">Show details</button>"
  }),
  addedLesson({
    slug: "setting-up-vs-code",
    title: "Setting up VS Code",
    purpose: "a readable editing workflow for creating and checking HTML",
    term: "Code editor",
    definition: "An application for authoring source files with editing and navigation features.",
    mechanic: "Open a project folder, create an .html file, save it, and use syntax highlighting to inspect markup.",
    pitfall: "Saving HTML with an accidental .txt extension or editing a file without knowing which project folder contains it.",
    practice: "Keep related files together in a clearly named project folder and save with the .html extension.",
    syntax: "project-folder/index.html",
    example: "<h1>My first file</h1><p>Saved from a code editor.</p>",
    exampleExplanation: "The editor stores this source as an HTML file that a browser can open.",
    output: "A simple page that can be previewed in a browser after saving as an .html file.",
    selector: "h1",
    solutionCode: "<h1>My first file</h1><p>Saved from a code editor.</p>"
  }),
  addedLesson({
    slug: "creating-your-first-html-file",
    title: "Creating your first HTML file",
    purpose: "a saved document a browser can parse and display",
    term: "HTML file",
    definition: "A text file containing HTML markup, conventionally saved with the .html extension.",
    mechanic: "Create a file, add a small valid HTML document, save with .html, and open it in a browser.",
    pitfall: "Forgetting to save edits before refreshing the browser or saving the file with the wrong extension.",
    practice: "Use a descriptive filename, save changes deliberately, and refresh the browser to inspect updates.",
    syntax: '<!doctype html><html lang="en">...</html>',
    example: '<!doctype html><html lang="en"><body><h1>Hello, web!</h1></body></html>',
    exampleExplanation: "A minimal saved HTML document contains a doctype, root, language, body, and heading.",
    output: "A browser page displaying the heading “Hello, web!”",
    selector: "body h1",
    solutionCode: '<!doctype html><html lang="en"><body><h1>Hello, web!</h1></body></html>'
  }),
  addedLesson({
    slug: "understanding-html-elements-and-tags",
    title: "Understanding HTML elements and tags",
    purpose: "the boundaries and content of structural units in markup",
    term: "Element",
    definition: "A complete HTML unit consisting of its tags, content, and any nested elements.",
    mechanic: "Use a start tag, related content, and a matching end tag for a normal element.",
    pitfall: "Confusing a tag with an entire element or mismatching start and end tags.",
    practice: "Read a fragment from its outer elements inward and pair every non-void start tag with its end tag.",
    syntax: "<p>Element content</p>",
    example: "<section><h2>Plan</h2><p>Choose a route.</p></section>",
    exampleExplanation: "A section element contains a heading and a paragraph as nested child elements.",
    output: "A section titled Plan with a paragraph describing the next step.",
    selector: "section > p",
    solutionCode: "<section><h2>Plan</h2><p>Choose a route.</p></section>"
  }),
  originalAttributesLesson,
  addedLesson({
    slug: "nesting-html-elements",
    title: "Nesting HTML elements",
    purpose: "clear parent-child and sibling relationships in a document",
    term: "Parent element",
    definition: "An element that directly contains another element as a child.",
    mechanic: "Close child elements before their parents and nest only elements allowed by the HTML content model.",
    pitfall: "Overlapping tags or placing an element in an invalid parent-child relationship.",
    practice: "Indent nested markup and validate document structure when an element's allowed children are uncertain.",
    syntax: "<article><h2>Topic</h2><p>Details</p></article>",
    example: "<article><h2>Field Notes</h2><p>Rain arrived at noon.</p></article>",
    exampleExplanation: "The article is the parent of its heading and paragraph, which are sibling children.",
    output: "A self-contained article with a heading and related details.",
    selector: "article > h2",
    solutionCode: "<article><h2>Field Notes</h2><p>Rain arrived at noon.</p></article>"
  }),
  addedLesson({
    slug: "your-first-webpage-project",
    title: "Your first webpage project",
    purpose: "a small complete page that combines structure and meaningful content",
    term: "Page structure",
    definition: "The organization of a document into regions and content elements that communicate its purpose.",
    mechanic: "Combine a document heading, section heading, descriptive paragraph, and useful link into a coherent page.",
    pitfall: "Writing an unstructured collection of tags without a clear topic or meaningful content hierarchy.",
    practice: "Plan the page's message first, create a logical heading outline, and use link text that describes its destination.",
    syntax: "<h1>Page topic</h1><h2>Section</h2><p>Details</p>",
    example: '<main><h1>City Garden</h1><p>Grow herbs in small spaces.</p><a href="guide.html">Read the garden guide</a></main>',
    exampleExplanation: "The main region contains a topic heading, explanatory text, and a descriptive link.",
    output: "A compact garden page with a clear topic, description, and useful next step.",
    selector: "main h1",
    requirements: [{ type: "element-text", selector: "main h1", text: "City Garden" }],
    solutionCode: '<main><h1>City Garden</h1><p>Grow herbs in small spaces.</p><a href="guide.html">Read the garden guide</a></main>'
  })
];

const documentModule = moduleBySlug("html-document-structure");
const originalCompleteDocument = documentModule.lessons.find((lesson) => lesson.slug === "complete-html-document");
const originalSemanticRegions = documentModule.lessons.find((lesson) => lesson.slug === "semantic-page-regions");
originalCompleteDocument.title = "Document structure best practices";
originalSemanticRegions.title = "The body element";
documentModule.lessons = [
  addedLesson({
    slug: "html-document-declaration",
    title: "HTML document declaration",
    purpose: "standards-mode parsing of a modern HTML document",
    term: "Doctype",
    definition: "The document declaration that tells browsers to parse the page using modern HTML standards.",
    mechanic: "Place the exact <!doctype html> declaration before the html root.",
    pitfall: "Omitting or misspelling the doctype, or placing page content before it.",
    practice: "Use one lowercase modern doctype as the first declaration in every complete HTML document.",
    syntax: "<!doctype html>",
    example: "<!doctype html><html><body><h1>Field Guide</h1></body></html>",
    exampleExplanation: "The doctype precedes the root and its page content.",
    output: "A standards-mode document containing a Field Guide heading.",
    selector: "body h1",
    solutionCode: "<!doctype html><html><body><h1>Field Guide</h1></body></html>"
  }),
  addedLesson({
    slug: "the-html-element",
    title: "The html element",
    purpose: "the root boundary and language context of the document",
    term: "Root element",
    definition: "The outermost html element that contains the head and body of a document.",
    mechanic: 'Put head and body inside html and declare the page language with lang, for example lang="en".',
    pitfall: "Leaving content outside the root or omitting the document's primary language.",
    practice: "Keep one html root and declare the predominant language on it.",
    syntax: '<html lang="en"><head>...</head><body>...</body></html>',
    example: '<html lang="en"><head><title>Atlas</title></head><body><h1>Atlas</h1></body></html>',
    exampleExplanation: "The html root contains metadata and body content and identifies English as its language.",
    output: "A document root with an English language declaration, metadata, and a visible heading.",
    selector: "html",
    requirements: [{ type: "attribute-equals", selector: "html", attribute: "lang", value: "en" }],
    solutionCode: '<html lang="en"><head><title>Atlas</title></head><body><h1>Atlas</h1></body></html>'
  }),
  addedLesson({
    slug: "the-head-element",
    title: "The head element",
    purpose: "metadata and resource information about the document",
    term: "head",
    definition: "The html child element containing metadata, document title, and related resource declarations.",
    mechanic: "Place title and meta elements inside head, before body.",
    pitfall: "Putting visible content such as paragraphs and headings in head.",
    practice: "Keep document metadata in head and user-facing page content in body.",
    syntax: "<head><meta charset=\"utf-8\"><title>Page name</title></head>",
    example: '<head><meta charset="utf-8"><title>Mountain Journal</title></head>',
    exampleExplanation: "The head contains the document encoding declaration and its title.",
    output: "Metadata that identifies the character encoding and browser-facing document title.",
    selector: "head title",
    solutionCode: '<head><meta charset="utf-8"><title>Mountain Journal</title></head>'
  }),
  addedLesson({
    slug: "page-title",
    title: "Page title",
    purpose: "a concise, meaningful name for browser tabs and other document interfaces",
    term: "title element",
    definition: "The head element whose text supplies a document's title to browsers and other services.",
    mechanic: "Write a unique, descriptive title inside title in the document head.",
    pitfall: "Using an empty or generic title or confusing it with the visible h1.",
    practice: "Make the title specific to the page and consistent with its visible main topic.",
    syntax: "<head><title>Descriptive page name</title></head>",
    example: "<head><title>Walking Trails | City Guide</title></head>",
    exampleExplanation: "The title provides a specific name for this guide in browser interfaces.",
    output: "The document is named “Walking Trails | City Guide”; this does not create a visible page heading.",
    selector: "title",
    requirements: [{ type: "element-text", selector: "title", text: "Walking Trails | City Guide" }],
    solutionCode: "<head><title>Walking Trails | City Guide</title></head>"
  }),
  addedLesson({
    slug: "meta-charset",
    title: "Meta charset",
    purpose: "reliable decoding of document text characters",
    term: "UTF-8",
    definition: "A widely used character encoding that represents text from many writing systems.",
    mechanic: 'Declare it early in head with <meta charset="utf-8">.',
    pitfall: "Leaving the encoding undeclared or using a declaration that disagrees with the document bytes.",
    practice: "Use UTF-8 consistently and place the charset declaration near the beginning of head.",
    syntax: '<meta charset="utf-8">',
    example: '<head><meta charset="utf-8"><title>Crème brûlée</title></head>',
    exampleExplanation: "The charset declaration identifies UTF-8 before the title text containing accented characters.",
    output: "The browser can decode the page's accented characters using UTF-8.",
    selector: "meta",
    requirements: [{ type: "attribute-equals", selector: "meta", attribute: "charset", value: "utf-8" }],
    solutionCode: '<head><meta charset="utf-8"><title>Crème brûlée</title></head>'
  }),
  addedLesson({
    slug: "viewport-meta-tag",
    title: "Viewport meta tag",
    purpose: "a layout viewport sized appropriately for mobile screens",
    term: "Viewport metadata",
    definition: "A meta declaration that guides the width and initial scale of the page's layout viewport.",
    mechanic: 'Use name="viewport" with content="width=device-width, initial-scale=1".',
    pitfall: "Omitting the viewport setting or disabling users' ability to zoom.",
    practice: "Use the standard device-width declaration and preserve browser zoom for accessibility.",
    syntax: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    example: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    exampleExplanation: "The meta element sets the viewport width to the device width and initializes scale.",
    output: "A mobile viewport that uses the available device width while preserving user zoom.",
    selector: 'meta[name="viewport"]',
    requirements: [{ type: "attribute-equals", selector: "meta", attribute: "name", value: "viewport" }],
    solutionCode: '<meta name="viewport" content="width=device-width, initial-scale=1">'
  }),
  addedLesson({
    slug: "html-comments",
    title: "HTML comments",
    purpose: "source-only notes that help authors maintain a document",
    term: "Comment",
    definition: "A source annotation written between <!-- and --> that is not rendered as page content.",
    mechanic: "Place a concise maintenance note between the comment delimiters.",
    pitfall: "Treating comments as private or placing sensitive information in public source.",
    practice: "Use comments sparingly to explain non-obvious decisions; never store secrets in HTML.",
    syntax: "<!-- Source note -->",
    example: "<!-- Review these dates each spring -->\n<p>Seasonal hours begin in May.</p>",
    exampleLines: ["A source comment reminds maintainers to review dates.", "A visible paragraph announces when seasonal hours begin."],
    exampleExplanation: "The first line is a source note; the paragraph is the content displayed to readers.",
    output: "Readers see the seasonal-hours sentence; the comment remains in source and is not visible page text.",
    selector: "p",
    solutionCode: "<!-- Review this notice each spring -->\n<p>Seasonal hours begin in May.</p>"
  }),
  originalSemanticRegions,
  originalCompleteDocument,
  addedLesson({
    slug: "document-structure-practice-project",
    title: "Practice project",
    purpose: "a complete, well-organized HTML document with metadata and accessible body content",
    term: "Document skeleton",
    definition: "The doctype and nested html, head, and body elements that form a complete HTML page.",
    mechanic: "Combine doctype, language, charset, viewport, title, and meaningful body content in valid order.",
    pitfall: "Leaving out document metadata or placing the page heading in head instead of body.",
    practice: "Validate the page skeleton, provide a descriptive title and language, and organize its content with semantic regions.",
    syntax: '<!doctype html><html lang="en"><head>...</head><body>...</body></html>',
    example: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Reading List</title></head><body><main><h1>Reading List</h1><p>Three books to explore.</p></main></body></html>',
    exampleExplanation: "The complete page has a declaration, language, metadata, and a semantic main content region.",
    output: "A complete Reading List page with metadata and a visible heading and description.",
    selector: "body main h1",
    requirements: [{ type: "element-text", selector: "body main h1", text: "Reading List" }],
    solutionCode: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Reading List</title></head><body><main><h1>Reading List</h1><p>Three books to explore.</p></main></body></html>'
  })
];

documentModule.lessons = [
  documentModule.lessons.find((lesson) => lesson.slug === "html-document-declaration"),
  documentModule.lessons.find((lesson) => lesson.slug === "the-html-element"),
  documentModule.lessons.find((lesson) => lesson.slug === "the-head-element"),
  originalSemanticRegions,
  documentModule.lessons.find((lesson) => lesson.slug === "page-title"),
  documentModule.lessons.find((lesson) => lesson.slug === "meta-charset"),
  documentModule.lessons.find((lesson) => lesson.slug === "viewport-meta-tag"),
  documentModule.lessons.find((lesson) => lesson.slug === "html-comments"),
  originalCompleteDocument,
  documentModule.lessons.find((lesson) => lesson.slug === "document-structure-practice-project")
];

const textModule = moduleBySlug("html-text-elements");
const headingsLesson = textModule.lessons.find((lesson) => lesson.slug === "headings-h1-to-h6");
const paragraphsLesson = textModule.lessons.find((lesson) => lesson.slug === "paragraphs-breaks-and-horizontal-rules");
const strongLesson = textModule.lessons.find((lesson) => lesson.slug === "importance-and-emphasis");
const markedTextLesson = textModule.lessons.find((lesson) => lesson.slug === "annotations-and-raised-text");
const formattingProjectLesson = textModule.lessons.find((lesson) => lesson.slug === "text-formatting-project");
headingsLesson.title = "Headings h1–h6";
paragraphsLesson.title = "Paragraphs";
strongLesson.title = "Bold and strong";
markedTextLesson.title = "Mark and highlighted text";
formattingProjectLesson.title = "Text formatting project";
textModule.lessons.push(
  addedLesson({
    slug: "line-breaks",
    title: "Line breaks",
    purpose: "a meaningful line boundary inside an otherwise continuous text block",
    term: "br",
    definition: "A void element that represents a line break that is part of the content.",
    mechanic: "Insert br where a line break belongs to the text, such as between lines of an address.",
    pitfall: "Stacking br elements to create page spacing or to imitate separate paragraphs.",
    practice: "Use br for content-driven line boundaries and use paragraphs or CSS for other structure and spacing.",
    syntax: "First line<br>Second line",
    example: "<p>42 Harbor Street<br>Northport</p>",
    exampleExplanation: "A single paragraph contains two address lines separated by a meaningful break.",
    output: "The address appears on two lines while remaining one paragraph.",
    selector: "p br",
    requirements: [{ type: "element-exists", selector: "p br" }],
    solutionCode: "<p>42 Harbor Street<br>Northport</p>"
  }),
  addedLesson({
    slug: "horizontal-rules",
    title: "Horizontal rules",
    purpose: "a thematic shift between sections or topics",
    term: "hr",
    definition: "A void element representing a thematic break between paragraph-level topics.",
    mechanic: "Place hr between content whose topic or scene meaningfully changes.",
    pitfall: "Using hr solely as a decorative line or generic vertical spacer.",
    practice: "Use hr to communicate a real thematic transition and style it with CSS if needed.",
    syntax: "<p>First topic.</p><hr><p>New topic.</p>",
    example: "<p>Morning route: coast path.</p><hr><p>Evening plan: town walk.</p>",
    exampleExplanation: "The hr separates the morning route from a different evening-plan topic.",
    output: "Two paragraphs are separated by a semantic thematic break.",
    selector: "hr",
    requirements: [{ type: "element-exists", selector: "hr" }],
    solutionCode: "<p>Morning route: coast path.</p><hr><p>Evening plan: town walk.</p>"
  }),
  addedLesson({
    slug: "italic-and-emphasis",
    title: "Italic and emphasis",
    purpose: "stress emphasis and alternate-voice text without conflating meaning and appearance",
    term: "em",
    definition: "An element marking stress emphasis that can affect the meaning of its sentence.",
    mechanic: "Use em for stressed emphasis and i for an alternate voice, mood, or convention such as a foreign phrase.",
    pitfall: "Using em or i only because the browser renders it in italics.",
    practice: "Choose em or i for its semantic role and use CSS when text needs a different visual style.",
    syntax: "<em>stressed word</em> · <i>alternate voice</i>",
    example: "<p>Please read <em>only</em> the first page. The phrase <i>ad hoc</i> means for this purpose.</p>",
    exampleExplanation: "Em stresses only, while i identifies a Latin phrase in an alternate voice.",
    output: "A sentence with stress emphasis and a conventionally italicized phrase identified by i.",
    selector: "p em",
    solutionCode: "<p>Read <em>carefully</em>; the term <i>ad hoc</i> means for this purpose.</p>"
  }),
  addedLesson({
    slug: "small-text",
    title: "Small text",
    purpose: "side comments and fine print associated with nearby content",
    term: "small",
    definition: "An element representing side comments, small print, or similar fine-print content.",
    mechanic: "Use small for an associated copyright notice, disclaimer, or qualification.",
    pitfall: "Choosing small for any text that should look tiny, even if it is important to read.",
    practice: "Keep essential instructions readable and choose small only when the text is genuinely ancillary.",
    syntax: "<small>Fine-print note</small>",
    example: "<p>Workshop begins at 10:00.</p><small>Schedule may change.</small>",
    exampleExplanation: "The small element marks an ancillary schedule qualification.",
    output: "A primary schedule announcement with a related fine-print note.",
    selector: "small",
    requirements: [{ type: "element-text", selector: "small", text: "Schedule may change." }],
    solutionCode: "<p>Workshop begins at 10:00.</p><small>Schedule may change.</small>"
  }),
  addedLesson({
    slug: "superscript-and-subscript",
    title: "Superscript and subscript",
    purpose: "conventional raised or lowered notation such as exponents and chemical formulas",
    term: "sub",
    definition: "An element marking text that should be rendered as subscript in a typographic convention.",
    mechanic: "Use sup for superscript and sub for subscript when the notation requires those positions.",
    pitfall: "Using raised or lowered elements as a general-purpose visual positioning trick.",
    practice: "Preserve the reading context and use superscript or subscript only when the notation calls for it.",
    syntax: "x<sup>2</sup> · H<sub>2</sub>O",
    example: "<p>Water is H<sub>2</sub>O; the area is 8 m<sup>2</sup>.</p>",
    exampleExplanation: "Subscript marks the chemical formula's 2, and superscript marks the area exponent.",
    output: "A paragraph showing water's chemical formula and a squared measurement unit.",
    selector: "p sub",
    requirements: [{ type: "element-text", selector: "sub", text: "2" }],
    solutionCode: "<p>Water is H<sub>2</sub>O; the area is 8 m<sup>2</sup>.</p>"
  }),
  addedLesson({
    slug: "preformatted-text",
    title: "Preformatted text",
    purpose: "content whose spaces and line breaks must be preserved",
    term: "pre",
    definition: "An element representing preformatted text in which whitespace is significant.",
    mechanic: "Wrap whitespace-sensitive plain text in pre; nest code inside it when that text is source code.",
    pitfall: "Using pre merely to obtain indentation or an unusual font for ordinary prose.",
    practice: "Use pre only when the original whitespace matters and provide an introduction or context for the block.",
    syntax: "<pre>line one\n  indented line</pre>",
    example: "<pre>north\n  east\n    south</pre>",
    exampleLines: ["Opens pre and shows the first line, north.", "Shows the second line with two leading spaces.", "Shows the third line with four leading spaces and closes pre."],
    exampleExplanation: "The pre element preserves the line breaks and indentation of this small text diagram.",
    output: "Three lines are displayed with their source indentation preserved.",
    selector: "pre",
    requirements: [{ type: "element-exists", selector: "pre" }],
    solutionCode: "<pre>north\n  east\n    south</pre>"
  }),
  addedLesson({
    slug: "code-and-keyboard-input",
    title: "Code and keyboard input elements",
    purpose: "distinguishing computer code from keys and input a person should enter",
    term: "kbd",
    definition: "An element identifying keyboard input such as a key name or key sequence.",
    mechanic: "Use code for source or program identifiers and kbd for keys the reader presses.",
    pitfall: "Marking every monospaced phrase as code or using kbd for output from a computer.",
    practice: "Identify the source of the text: program syntax uses code, while user-entered keyboard input uses kbd.",
    syntax: "<code>save()</code> · <kbd>Ctrl</kbd> + <kbd>S</kbd>",
    example: "<p>Run <code>save()</code>, then press <kbd>Ctrl</kbd> + <kbd>S</kbd>.</p>",
    exampleExplanation: "The function name is code, while the two keyboard keys are user input.",
    output: "An instruction distinguishes a program function from the keys a person presses.",
    selector: "p kbd",
    requirements: [{ type: "element-exists", selector: "code" }, { type: "element-exists", selector: "kbd" }],
    solutionCode: "<p>Run <code>save()</code>, then press <kbd>Ctrl</kbd> + <kbd>S</kbd>.</p>"
  }),
  addedLesson({
    slug: "blockquote-and-quotations",
    title: "Blockquote and quotations",
    purpose: "distinguishing extended quotations from short inline quotations",
    term: "blockquote",
    definition: "An element for an extended quotation whose content is cited from another source.",
    mechanic: "Use blockquote for an extended passage, q for a short inline quote, and cite for a work title when appropriate.",
    pitfall: "Using blockquote only to indent text or adding duplicate quote marks around q content without checking rendering.",
    practice: "Keep quoted words distinct from your prose and identify the source when it is known.",
    syntax: "<blockquote><p>Extended quotation.</p><cite>Work title</cite></blockquote> · <q>short quote</q>",
    example: '<blockquote><p>Careful observation improves every map.</p><cite>Field Journal</cite></blockquote>',
    exampleExplanation: "Blockquote identifies an extended quoted passage, and cite identifies the source work title.",
    output: "An extended quotation visually and semantically distinguished from the surrounding text.",
    selector: "blockquote cite",
    requirements: [{ type: "element-exists", selector: "blockquote cite" }],
    solutionCode: '<blockquote><p>Careful observation improves every map.</p><cite>Field Journal</cite></blockquote>'
  })
);
textModule.lessons = [
  headingsLesson,
  paragraphsLesson,
  textModule.lessons.find((lesson) => lesson.slug === "line-breaks"),
  textModule.lessons.find((lesson) => lesson.slug === "horizontal-rules"),
  strongLesson,
  textModule.lessons.find((lesson) => lesson.slug === "italic-and-emphasis"),
  markedTextLesson,
  textModule.lessons.find((lesson) => lesson.slug === "small-text"),
  textModule.lessons.find((lesson) => lesson.slug === "superscript-and-subscript"),
  textModule.lessons.find((lesson) => lesson.slug === "preformatted-text"),
  textModule.lessons.find((lesson) => lesson.slug === "code-and-keyboard-input"),
  textModule.lessons.find((lesson) => lesson.slug === "blockquote-and-quotations"),
  formattingProjectLesson
];

const linksModule = moduleBySlug("links-and-navigation");
const hyperlinksLesson = linksModule.lessons.find((lesson) => lesson.slug === "creating-descriptive-links");
const fragmentLinksLesson = linksModule.lessons.find((lesson) => lesson.slug === "page-fragments-and-external-links");
hyperlinksLesson.title = "Introduction to hyperlinks";
fragmentLinksLesson.title = "Page section navigation";
linksModule.lessons.push(
  addedLesson({
    slug: "anchor-element",
    title: "Anchor element",
    purpose: "a navigable connection between the link text and its destination",
    term: "Anchor",
    definition: "The a element that creates a hyperlink when it has an href destination.",
    mechanic: "Place descriptive link text inside an a element and set its href to the intended destination.",
    pitfall: "Writing an anchor without href or using link text that gives no clue about its destination.",
    practice: "Make link purpose understandable out of context and verify that the destination is correct.",
    syntax: '<a href="destination">descriptive text</a>',
    example: '<a href="guide.html">Read the visitor guide</a>',
    exampleExplanation: "An anchor connects descriptive link text to a relative page destination.",
    output: "A keyboard-accessible hyperlink labeled “Read the visitor guide.”",
    selector: "a[href]",
    requirements: [{ type: "element-exists", selector: "a[href]" }],
    solutionCode: '<a href="guide.html">Read the visitor guide</a>'
  }),
  addedLesson({
    slug: "absolute-urls",
    title: "Absolute URLs",
    purpose: "an explicit destination that includes its scheme and host",
    term: "Absolute URL",
    definition: "A complete URL that identifies a resource with a scheme and domain, and optionally a path.",
    mechanic: "Use a complete HTTPS URL when linking to a specific external site.",
    pitfall: "Leaving out the scheme or copying a misleading URL that does not point to the intended destination.",
    practice: "Inspect external destinations, prefer HTTPS, and use concise descriptive anchor text.",
    syntax: '<a href="https://example.org/path">External resource</a>',
    example: '<a href="https://example.org/parks">National park information</a>',
    exampleExplanation: "The href includes the HTTPS scheme, host, and destination path.",
    output: "A link to the parks resource on the external example.org site.",
    selector: 'a[href="https://example.org/parks"]',
    requirements: [{ type: "attribute-equals", selector: "a", attribute: "href", value: "https://example.org/parks" }],
    solutionCode: '<a href="https://example.org/parks">National park information</a>'
  }),
  addedLesson({
    slug: "relative-urls",
    title: "Relative URLs",
    purpose: "links among resources within a site without repeating its domain",
    term: "Relative URL",
    definition: "A path interpreted in relation to the current document's location.",
    mechanic: "Use a path such as guides/planting.html or ../index.html for a nearby local resource.",
    pitfall: "Assuming a path is site-root-relative when it is relative to the current file's directory.",
    practice: "Check the path from the linking document's location and test nested and parent-directory links.",
    syntax: '<a href="guides/planting.html">Planting guide</a>',
    example: '<a href="../index.html">Course home</a>',
    exampleExplanation: "The parent-directory segment links from a nested page to its parent folder's index.",
    output: "A link to index.html one directory above the current document.",
    selector: 'a[href="../index.html"]',
    requirements: [{ type: "attribute-equals", selector: "a", attribute: "href", value: "../index.html" }],
    solutionCode: '<a href="../index.html">Course home</a>'
  }),
  addedLesson({
    slug: "opening-links-in-new-tabs-safely",
    title: "Opening links in a new tab safely",
    purpose: "intentional new browsing contexts without exposing the opener relationship",
    term: "noopener",
    definition: "A rel value that prevents a newly opened page from controlling the page that opened it.",
    mechanic: 'When a new tab is genuinely needed, use target="_blank" with rel="noopener" and disclose the behavior.',
    pitfall: "Opening unexpected tabs or using target=_blank without an appropriate rel protection.",
    practice: "Open links in the same context by default; when opening a new tab, disclose it and use noopener.",
    syntax: '<a href="https://example.org" target="_blank" rel="noopener">External page (new tab)</a>',
    example: '<a href="https://example.org/help" target="_blank" rel="noopener">Open help in a new tab</a>',
    exampleExplanation: "The external HTTPS link discloses the new tab and prevents access to its opener.",
    output: "A clearly labeled new-tab help link protected with rel=noopener.",
    selector: 'a[target="_blank"]',
    requirements: [{ type: "attribute-equals", selector: "a", attribute: "target", value: "_blank" }, { type: "attribute-equals", selector: "a", attribute: "rel", value: "noopener" }],
    solutionCode: '<a href="https://example.org/help" target="_blank" rel="noopener">Open help in a new tab</a>'
  }),
  addedLesson({
    slug: "email-links",
    title: "Email links",
    purpose: "opening an email application with a recipient address prepared",
    term: "mailto URL",
    definition: "A URL using the mailto scheme to identify an email recipient.",
    mechanic: 'Set an anchor href to mailto: followed by the intended address.',
    pitfall: "Using a mailto link without visible text that identifies the email action or recipient.",
    practice: "Show the address or a clear contact label and do not rely on email links as the only contact option.",
    syntax: '<a href="mailto:hello@example.org">Email the team</a>',
    example: '<a href="mailto:hello@example.org">Email the visitor center</a>',
    exampleExplanation: "The mailto destination prepares an email addressed to the visitor center.",
    output: "A link that opens the user's configured email application with the recipient filled in.",
    selector: 'a[href^="mailto:"]',
    requirements: [{ type: "element-exists", selector: 'a[href^="mailto:"]' }],
    solutionCode: '<a href="mailto:hello@example.org">Email the visitor center</a>'
  }),
  addedLesson({
    slug: "telephone-links",
    title: "Telephone links",
    purpose: "making a phone number actionable on devices that support calling",
    term: "tel URL",
    definition: "A URL using the tel scheme to identify a telephone number.",
    mechanic: 'Use an anchor href with tel: and a properly formatted phone number.',
    pitfall: "Showing one phone number while the tel destination contains a different number.",
    practice: "Keep the visible number and destination consistent and include context about the contact.",
    syntax: '<a href="tel:+15550102020">Call the office</a>',
    example: '<a href="tel:+15550102020">Call +1 555 010 2020</a>',
    exampleExplanation: "The tel link encodes the same phone number that is shown to users.",
    output: "A call link that supported devices can pass to their telephone application.",
    selector: 'a[href^="tel:"]',
    requirements: [{ type: "element-exists", selector: 'a[href^="tel:"]' }],
    solutionCode: '<a href="tel:+15550102020">Call +1 555 010 2020</a>'
  }),
  addedLesson({
    slug: "download-links",
    title: "Download links",
    purpose: "identifying and linking to a file users can retrieve",
    term: "download attribute",
    definition: "An anchor attribute that can suggest downloading a same-origin linked resource.",
    mechanic: "Link to the actual file and optionally use download with a sensible filename for a same-origin resource.",
    pitfall: "Assuming download forces every cross-origin resource to download or leaving the file type unclear.",
    practice: "Name the file type and size where useful, use trusted resources, and test the destination and download behavior.",
    syntax: '<a href="files/guide.pdf" download>Download the guide (PDF)</a>',
    example: '<a href="files/trail-map.pdf" download>Download trail map (PDF)</a>',
    exampleExplanation: "The anchor identifies a PDF resource and suggests downloading it.",
    output: "A descriptive link to a trail-map PDF, with a download hint for supported same-origin behavior.",
    selector: "a[download]",
    requirements: [{ type: "element-exists", selector: "a[download]" }],
    solutionCode: '<a href="files/trail-map.pdf" download>Download trail map (PDF)</a>'
  }),
  addedLesson({
    slug: "navigation-menus",
    title: "Navigation menus",
    purpose: "a recognizable group of links for moving among important site destinations",
    term: "Navigation landmark",
    definition: "A nav element identifying a significant group of navigation links.",
    mechanic: "Group related site links inside nav and use list items when a list structure helps express the menu.",
    pitfall: "Using nav for every incidental link group or creating a menu whose labels do not identify destinations.",
    practice: "Keep navigation concise, use descriptive labels, and ensure links work with keyboard and without scripting.",
    syntax: "<nav><ul><li><a href=\"...\">Destination</a></li></ul></nav>",
    example: '<nav aria-label="Primary"><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li></ul></nav>',
    exampleExplanation: "A labeled navigation landmark groups two important site destinations in a list.",
    output: "A primary navigation region with Home and About links.",
    selector: "nav a",
    requirements: [{ type: "element-exists", selector: "nav a" }],
    solutionCode: '<nav aria-label="Primary"><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li></ul></nav>'
  }),
  addedLesson({
    slug: "multi-page-website-project",
    title: "Build a multi-page website",
    purpose: "consistent navigation among a small set of related HTML pages",
    term: "Site navigation",
    definition: "A system of links that helps readers move among related pages in a website.",
    mechanic: "Create descriptive links with correct relative paths and repeat a consistent navigation region on each page.",
    pitfall: "Using broken relative paths or link labels that do not match page destinations.",
    practice: "Plan the page set, organize files predictably, and test every navigation path from every page.",
    syntax: '<nav><a href="index.html">Home</a><a href="about.html">About</a></nav>',
    example: '<nav><a href="index.html">Home</a><a href="events.html">Events</a></nav><main><h1>Community Garden</h1></main>',
    exampleExplanation: "Navigation links connect two site pages, and main contains this page's unique content.",
    output: "A community-garden page with links to its Home and Events pages.",
    selector: "nav a[href]",
    requirements: [{ type: "element-exists", selector: "nav a[href]" }, { type: "element-exists", selector: "main h1" }],
    solutionCode: '<nav><a href="index.html">Home</a><a href="events.html">Events</a></nav><main><h1>Community Garden</h1></main>'
  })
);
linksModule.lessons = [
  hyperlinksLesson,
  linksModule.lessons.find((lesson) => lesson.slug === "anchor-element"),
  linksModule.lessons.find((lesson) => lesson.slug === "absolute-urls"),
  linksModule.lessons.find((lesson) => lesson.slug === "relative-urls"),
  linksModule.lessons.find((lesson) => lesson.slug === "opening-links-in-new-tabs-safely"),
  linksModule.lessons.find((lesson) => lesson.slug === "email-links"),
  linksModule.lessons.find((lesson) => lesson.slug === "telephone-links"),
  fragmentLinksLesson,
  linksModule.lessons.find((lesson) => lesson.slug === "download-links"),
  linksModule.lessons.find((lesson) => lesson.slug === "navigation-menus"),
  linksModule.lessons.find((lesson) => lesson.slug === "multi-page-website-project")
];

const imagesModule = moduleBySlug("images-and-graphics");
const imageAltLesson = imagesModule.lessons.find((lesson) => lesson.slug === "images-and-alt-text");
const responsiveFigureLesson = imagesModule.lessons.find((lesson) => lesson.slug === "responsive-images-and-figures");
imageAltLesson.title = "src and alt attributes";
responsiveFigureLesson.title = "Figure and figcaption";
imagesModule.lessons.push(
  addedLesson({
    slug: "introduction-to-images",
    title: "Introduction to images",
    purpose: "visual information that supports the meaning and task of a web page",
    term: "Raster image",
    definition: "An image made of pixels, commonly stored in formats such as JPEG, PNG, or WebP.",
    mechanic: "Choose an image format and source that suit the content, quality, and delivery needs.",
    pitfall: "Adding an image without considering its purpose, file size, or text alternative.",
    practice: "Use images deliberately, keep files appropriately optimized, and provide alternatives based on their role.",
    syntax: '<img src="photo.webp" alt="Description">',
    example: '<img src="images/bicycle.webp" alt="A blue bicycle leaning against a brick wall">',
    exampleExplanation: "The image illustrates the page content and carries an alternative description.",
    output: "A bicycle photograph appears in the document with an available text alternative.",
    selector: "img",
    solutionCode: '<img src="images/bicycle.webp" alt="A blue bicycle leaning against a brick wall">'
  }),
  addedLesson({
    slug: "image-element",
    title: "Image element",
    purpose: "embedding an image resource in document content",
    term: "img",
    definition: "A void HTML element that embeds an image resource in a page.",
    mechanic: "Use img with a valid source and an alt value appropriate to the image's role.",
    pitfall: "Writing a closing img tag or omitting the alternative text attribute.",
    practice: "Remember that img is void and always include alt, using an empty value for decorative content.",
    syntax: '<img src="photo.jpg" alt="Description">',
    example: '<img src="images/compass.jpg" alt="A compass pointing north">',
    exampleExplanation: "The void img element embeds a compass image and includes its text alternative.",
    output: "A compass image is embedded with a concise alternative.",
    selector: "img[alt]",
    requirements: [{ type: "element-exists", selector: "img[alt]" }],
    solutionCode: '<img src="images/compass.jpg" alt="A compass pointing north">'
  }),
  addedLesson({
    slug: "image-dimensions",
    title: "Image dimensions",
    purpose: "declaring useful intrinsic dimensions and reserving layout space",
    term: "Intrinsic dimensions",
    definition: "The source image's natural pixel width and height.",
    mechanic: "Provide accurate width and height attributes when known, then use CSS to scale proportionally.",
    pitfall: "Declaring dimensions that distort the image or disagree with its intrinsic ratio.",
    practice: "Use accurate dimensions to help browsers reserve space and preserve aspect ratio as layout changes.",
    syntax: '<img src="chart.png" alt="Sales chart" width="640" height="360">',
    example: '<img src="images/chart.png" alt="Monthly rainfall chart" width="640" height="360">',
    exampleExplanation: "The image includes its accurate intrinsic width and height to reserve proportional space.",
    output: "A chart image whose expected 640-by-360 space can be reserved before it loads.",
    selector: "img",
    requirements: [{ type: "attribute-equals", selector: "img", attribute: "width", value: "640" }, { type: "attribute-equals", selector: "img", attribute: "height", value: "360" }],
    solutionCode: '<img src="images/chart.png" alt="Monthly rainfall chart" width="640" height="360">'
  }),
  addedLesson({
    slug: "responsive-images",
    title: "Responsive images",
    purpose: "appropriate image rendering across varying viewport sizes and display densities",
    term: "srcset",
    definition: "An img attribute that offers candidate image resources so the browser can select an appropriate one.",
    mechanic: "Use srcset with descriptive width or density candidates and sizes when layout width is predictable.",
    pitfall: "Providing candidates with incorrect descriptors or omitting a sensible fallback src.",
    practice: "Generate candidates from the same image content and test selection at relevant viewport sizes.",
    syntax: '<img src="small.jpg" srcset="small.jpg 480w, large.jpg 960w" sizes="100vw" alt="...">',
    example: '<img src="images/coast-480.jpg" srcset="images/coast-480.jpg 480w, images/coast-960.jpg 960w" sizes="100vw" alt="A coastline at low tide">',
    exampleExplanation: "The browser can choose between two width-described sources according to the viewport sizing hint.",
    output: "An image with a fallback and responsive source candidates for different rendered widths.",
    selector: "img[srcset]",
    requirements: [{ type: "element-exists", selector: "img[srcset]" }],
    solutionCode: '<img src="images/coast-480.jpg" srcset="images/coast-480.jpg 480w, images/coast-960.jpg 960w" sizes="100vw" alt="A coastline at low tide">'
  }),
  addedLesson({
    slug: "picture-element",
    title: "Picture element",
    purpose: "art direction or format selection using alternative image sources",
    term: "picture",
    definition: "A container that supplies zero or more source choices for an img fallback.",
    mechanic: "Place source elements before a required fallback img and use appropriate media or type conditions.",
    pitfall: "Omitting the fallback img or providing alternatives that change essential image meaning.",
    practice: "Keep alternatives equivalent in meaning, include a fallback, and check that source conditions are correct.",
    syntax: '<picture><source media="(min-width: 700px)" srcset="wide.jpg"><img src="default.jpg" alt="..."></picture>',
    example: '<picture><source media="(min-width: 700px)" srcset="images/wide-map.jpg"><img src="images/map.jpg" alt="Map of the walking route"></picture>',
    exampleExplanation: "The picture offers a wide-screen source and keeps img as the required fallback with alt text.",
    output: "The browser can select the wide map when its media condition matches, otherwise it uses the fallback.",
    selector: "picture > img",
    requirements: [{ type: "element-exists", selector: "picture > img" }],
    solutionCode: '<picture><source media="(min-width: 700px)" srcset="images/wide-map.jpg"><img src="images/map.jpg" alt="Map of the walking route"></picture>'
  }),
  addedLesson({
    slug: "image-accessibility",
    title: "Image accessibility",
    purpose: "equivalent access to the information or action conveyed by an image",
    term: "Alternative text",
    definition: "A text alternative that communicates an informative image's relevant content or a functional image's purpose.",
    mechanic: "Write context-specific alt for informative or functional images and alt=\"\" for decorative images.",
    pitfall: "Repeating nearby text, announcing decorative imagery, or leaving alt off entirely.",
    practice: "Decide whether each image is informative, decorative, or functional before writing its alternative.",
    syntax: '<img src="..." alt="Purposeful alternative"> · <img src="..." alt="">',
    example: '<a href="map.html"><img src="map-icon.svg" alt="Open the route map"></a>',
    exampleExplanation: "Because the image is the link's content, its alternative describes the link's destination.",
    output: "A linked icon that has an accessible name describing the route-map destination.",
    selector: "a img[alt]",
    requirements: [{ type: "element-exists", selector: "a img[alt]" }],
    solutionCode: '<a href="map.html"><img src="map-icon.svg" alt="Open the route map"></a>'
  }),
  addedLesson({
    slug: "common-image-mistakes",
    title: "Common image mistakes",
    purpose: "reliable loading, clear alternatives, and undistorted presentation",
    term: "Image fallback",
    definition: "A valid default image resource and alternative text available when a preferred source cannot be used.",
    mechanic: "Check every src path, include alt, use trusted sources, and preserve the image's proportions.",
    pitfall: "Broken paths, missing alt text, oversized files, or stretching an image with mismatched dimensions.",
    practice: "Test each image URL, optimize file size, provide alternatives, and let responsive sizing preserve aspect ratio.",
    syntax: '<img src="images/photo.jpg" alt="Relevant description">',
    example: '<img src="images/bridge.jpg" alt="Stone bridge over a narrow stream" width="800" height="500">',
    exampleExplanation: "A correct local source, informative alternative, and matching dimensions avoid common failures.",
    output: "A proportionally sized bridge image with a useful alternative if it cannot be seen.",
    selector: "img[src][alt]",
    requirements: [{ type: "element-exists", selector: "img[src][alt]" }],
    solutionCode: '<img src="images/bridge.jpg" alt="Stone bridge over a narrow stream" width="800" height="500">'
  }),
  addedLesson({
    slug: "image-gallery-project",
    title: "Image gallery project",
    purpose: "a coherent gallery of accessible images with captions and responsive behavior",
    term: "Image gallery",
    definition: "A collection of related images organized so users can browse and understand each item.",
    mechanic: "Group each image and caption in figure, provide useful alt text, and keep a logical reading order.",
    pitfall: "Treating captions as substitutes for alt text or arranging image items in a confusing order.",
    practice: "Give each informative image its own alternative, keep captions concise, and test the gallery at narrow widths.",
    syntax: "<figure><img src=\"...\" alt=\"...\"><figcaption>...</figcaption></figure>",
    example: '<figure><img src="images/rose.jpg" alt="Pink rose blooming beside a garden wall"><figcaption>Early summer rose.</figcaption></figure>',
    exampleExplanation: "A figure groups an informative photograph with its visible caption.",
    output: "One accessible gallery item with an image alternative and its own caption.",
    selector: "figure img[alt]",
    requirements: [{ type: "element-exists", selector: "figure img[alt]" }, { type: "element-exists", selector: "figcaption" }],
    solutionCode: '<figure><img src="images/rose.jpg" alt="Pink rose blooming beside a garden wall"><figcaption>Early summer rose.</figcaption></figure>'
  })
);
imagesModule.lessons = [
  imagesModule.lessons.find((lesson) => lesson.slug === "introduction-to-images"),
  imagesModule.lessons.find((lesson) => lesson.slug === "image-element"),
  imageAltLesson,
  imagesModule.lessons.find((lesson) => lesson.slug === "image-dimensions"),
  imagesModule.lessons.find((lesson) => lesson.slug === "responsive-images"),
  responsiveFigureLesson,
  imagesModule.lessons.find((lesson) => lesson.slug === "picture-element"),
  imagesModule.lessons.find((lesson) => lesson.slug === "image-accessibility"),
  imagesModule.lessons.find((lesson) => lesson.slug === "common-image-mistakes"),
  imagesModule.lessons.find((lesson) => lesson.slug === "image-gallery-project")
];

moduleBySlug("html-document-structure").lessons.push(
  addedLesson({
    slug: "doctype-and-standards-mode",
    title: "The HTML Doctype",
    purpose: "a browser's interpretation of a document using modern standards",
    term: "Doctype",
    definition: "A declaration at the beginning of an HTML document that triggers standards-mode parsing.",
    mechanic: "Place <!doctype html> before the html root element.",
    pitfall: "Omitting or misplacing the declaration so the browser may use legacy quirks behavior.",
    practice: "Begin complete documents with the modern doctype exactly once, before any page markup.",
    syntax: "<!doctype html>",
    example: "<!doctype html>\n<html lang=\"en\"><head><title>Trail Map</title></head><body><h1>Trail Map</h1></body></html>",
    exampleLines: ["Declares a modern HTML document.", "Creates the root, English language, metadata, body content, and Trail Map heading."],
    exampleExplanation: "The doctype comes first, then a root with metadata and visible page content.",
    output: "A standards-mode HTML document titled Trail Map with a visible main heading.",
    selector: "body h1",
    solutionCode: "<!doctype html><html lang=\"en\"><head><title>Club News</title></head><body><h1>Club News</h1></body></html>"
  }),
  addedLesson({
    slug: "document-language",
    title: "Setting the Document Language",
    purpose: "language-aware pronunciation and text processing",
    term: "Document language",
    definition: "A language declaration, commonly the lang attribute on html, describing the primary document language.",
    mechanic: 'Set a suitable language tag such as lang="en" on the html root.',
    pitfall: "Leaving the primary language unspecified or labeling a document with a language its content does not use.",
    practice: "Declare the predominant language on html and mark language changes on individual passages when useful.",
    syntax: '<html lang="en">...</html>',
    example: '<html lang="en"><body><p>Good morning.</p></body></html>',
    exampleExplanation: "The html root declares English as the primary language for its content.",
    output: "A document whose primary language is identified as English.",
    selector: "html",
    requirements: [{ type: "attribute-equals", selector: "html", attribute: "lang", value: "en" }],
    solutionCode: '<html lang="en"><body><p>Good morning.</p></body></html>'
  }),
  addedLesson({
    slug: "character-encoding",
    title: "Character Encoding with UTF-8",
    purpose: "consistent interpretation of letters and symbols in page text",
    term: "Character encoding",
    definition: "A mapping that determines how text characters are represented and decoded.",
    mechanic: 'Declare UTF-8 with <meta charset="utf-8"> near the start of head.',
    pitfall: "Serving text without a consistent encoding declaration, which can produce garbled characters.",
    practice: "Use UTF-8 for modern documents and keep the declaration early in the head.",
    syntax: '<meta charset="utf-8">',
    example: '<head><meta charset="utf-8"><title>Café Guide</title></head>',
    exampleExplanation: "The head declares UTF-8 before the title, supporting accented characters in page text.",
    output: "Document metadata with UTF-8 encoding and a Café Guide title.",
    selector: 'meta[charset="utf-8"]',
    requirements: [{ type: "attribute-equals", selector: "meta", attribute: "charset", value: "utf-8" }],
    solutionCode: '<head><meta charset="utf-8"><title>Café Guide</title></head>'
  }),
  addedLesson({
    slug: "viewport-metadata",
    title: "Viewport Metadata for Mobile Pages",
    purpose: "a sensible layout viewport on mobile devices",
    term: "Viewport",
    definition: "The visible region through which a user views a page, with dimensions that vary by device.",
    mechanic: 'Add a viewport meta element with width=device-width and an initial-scale value.',
    pitfall: "Omitting viewport metadata and forcing mobile browsers to render a wide desktop-sized layout.",
    practice: "Use the standard device-width viewport and do not disable user zoom, which supports accessibility.",
    syntax: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    example: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    exampleExplanation: "The declaration makes the layout viewport match the device width and sets the initial scale.",
    output: "Mobile browsers use the device width as the page layout viewport while retaining user zoom.",
    selector: 'meta[name="viewport"]',
    requirements: [{ type: "attribute-equals", selector: "meta", attribute: "name", value: "viewport" }],
    solutionCode: '<meta name="viewport" content="width=device-width, initial-scale=1">'
  }),
  addedLesson({
    slug: "document-title-and-description",
    title: "Page Titles and Meta Descriptions",
    purpose: "a concise document name and useful summary metadata",
    term: "Document title",
    definition: "The title element's text, which names a document in browser tabs, history, and other interfaces.",
    mechanic: "Write one descriptive title in head and use a meta description for a concise page summary.",
    pitfall: "Using the same vague title on every page or mistaking metadata for a visible page heading.",
    practice: "Make each title specific to its page and ensure the visible heading and metadata describe the same topic.",
    syntax: '<title>Page name</title> · <meta name="description" content="Summary">',
    example: '<head><title>Coastal Walks | Visitor Guide</title><meta name="description" content="Routes and safety tips for coastal walks."></head>',
    exampleExplanation: "The head provides a specific browser title and a concise description of the page.",
    output: "A descriptive document title and metadata summary; neither replaces the page's visible heading.",
    selector: "title",
    solutionCode: '<head><title>Coastal Walks | Visitor Guide</title><meta name="description" content="Routes and safety tips for coastal walks."></head>'
  }),
  addedLesson({
    slug: "head-and-body",
    title: "Head Metadata and Body Content",
    purpose: "separation between document information and the page's user-facing content",
    term: "Document head",
    definition: "The region inside html that holds metadata and document-level information.",
    mechanic: "Place metadata such as title in head and visible content such as headings in body.",
    pitfall: "Putting visible page content in head or metadata elements among body paragraphs.",
    practice: "Keep head and body as siblings inside html and put each element in its proper region.",
    syntax: "<html><head>metadata</head><body>page content</body></html>",
    example: "<html><head><title>Notebook</title></head><body><h1>Notebook</h1></body></html>",
    exampleExplanation: "The title is metadata in head, while the heading is visible body content.",
    output: "A document with a browser title and a separate visible page heading.",
    selector: "head title",
    solutionCode: "<html><head><title>Notebook</title></head><body><h1>Notebook</h1></body></html>"
  }),
  addedLesson({
    slug: "section-and-article",
    title: "Sections and Articles",
    purpose: "distinct thematic sections and self-contained pieces of content",
    term: "article",
    definition: "A self-contained composition that can be understood or distributed independently.",
    mechanic: "Use section for a thematic grouping, and article for a self-contained item with its own topic.",
    pitfall: "Choosing section and article only for their default appearance instead of their content relationships.",
    practice: "Give meaningful sections headings and use article only when its content stands as an independent composition.",
    syntax: "<section><h2>Topic</h2>...</section> · <article>...</article>",
    example: "<section><h2>Latest news</h2><article><h3>New trail opens</h3><p>The route is now accessible.</p></article></section>",
    exampleExplanation: "A thematic section contains an independently meaningful news article.",
    output: "A Latest news section containing a self-contained New trail opens article.",
    selector: "section > article",
    solutionCode: "<section><h2>Events</h2><article><h3>Open day</h3><p>Join us Saturday.</p></article></section>"
  }),
  addedLesson({
    slug: "div-and-span-groups",
    title: "Generic Grouping with Div and Span",
    purpose: "grouping content when no more specific semantic element fits",
    term: "Generic container",
    definition: "A div or span that groups content without adding a specialized semantic meaning.",
    mechanic: "Use div for a block grouping and span for a phrase-level grouping only when a semantic element is not appropriate.",
    pitfall: "Replacing meaningful elements such as nav, main, or strong with generic containers.",
    practice: "Prefer the most specific native semantic element; reserve div and span for neutral grouping and styling hooks.",
    syntax: "<div>block group</div> · <span>phrase group</span>",
    example: '<p>Weather: <span class="reading">12 degrees</span>.</p>',
    exampleExplanation: "Span neutrally groups a phrase within the paragraph without changing its meaning.",
    output: "A paragraph with the reading grouped as an inline span.",
    selector: "p span",
    solutionCode: '<p>Weather: <span class="reading">12 degrees</span>.</p>'
  })
);
documentModule.lessons = documentModule.lessons.slice(0, 10);
