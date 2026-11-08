const PYTHON_TUTORIAL = "https://docs.python.org/3/tutorial/";
const PYTHON_CONTROL_FLOW = "https://docs.python.org/3/tutorial/controlflow.html";
const PYTHON_DATA_STRUCTURES = "https://docs.python.org/3/tutorial/datastructures.html";
const PYTHON_ERRORS = "https://docs.python.org/3/tutorial/errors.html";
const PYTHON_FILES = "https://docs.python.org/3/tutorial/inputoutput.html";
const PYTHON_CLASSES = "https://docs.python.org/3/tutorial/classes.html";
const PEP8 = "https://peps.python.org/pep-0008/";
const READING_LIST_REFERENCE_SOLUTION = `from pathlib import Path
import json

DATA_FILE = Path("reading-list-practice.json")

class ReadingItem:
  def __init__(self, title, done=False):
    self.title = title
    self.done = done

  def to_record(self):
    return {"title": self.title, "done": self.done}

  @classmethod
  def from_record(cls, record):
    if not isinstance(record, dict) or not isinstance(record.get("title"), str):
      raise ValueError("Each item needs a text title.")
    return cls(record["title"], bool(record.get("done", False)))

def load_items(path=DATA_FILE):
  try:
    raw = json.loads(path.read_text(encoding="utf-8"))
  except FileNotFoundError:
    return []
  except json.JSONDecodeError as error:
    raise ValueError("The reading-list file contains invalid JSON.") from error
  if not isinstance(raw, list):
    raise ValueError("The reading-list file must contain a list.")
  return [ReadingItem.from_record(record) for record in raw]

def save_items(items, path=DATA_FILE):
  records = [item.to_record() for item in items]
  path.write_text(json.dumps(records, indent=2), encoding="utf-8")

def add_item(items, title):
  cleaned = title.strip()
  if not cleaned:
    raise ValueError("A title cannot be empty.")
  items.append(ReadingItem(cleaned))

def mark_done(items, title):
  for item in items:
    if item.title.casefold() == title.strip().casefold():
      item.done = True
      return True
  return False

def display_items(items):
  if not items:
    print("Your reading list is empty.")
    return
  for index, item in enumerate(items, start=1):
    status = "done" if item.done else "to read"
    print(f"{index}. {item.title} - {status}")

def main():
  try:
    items = load_items()
  except ValueError as error:
    print(error)
    return
  while True:
    command = input("Command (list/add/done/quit): ").strip().lower()
    try:
      if command == "list":
        display_items(items)
      elif command == "add":
        add_item(items, input("Title: "))
        save_items(items)
      elif command == "done":
        title = input("Title to complete: ")
        if mark_done(items, title):
          save_items(items)
        else:
          print("That title is not in the list.")
      elif command == "quit":
        break
      else:
        print("Choose list, add, done, or quit.")
    except ValueError as error:
      print(error)

if __name__ == "__main__":
  main()
`;

function question(questionKey, type, prompt, choices, correctChoiceId, explanation) {
  return { questionKey, type, prompt, choices, correctChoiceId, explanation };
}

function createLesson(spec) {
  const { quiz, ...lesson } = spec;
  lesson.quiz = [
    question(`${lesson.slug}-q1`, "multiple-choice", quiz.prompt, quiz.choices, quiz.answer, quiz.explanation),
    question(
      `${lesson.slug}-q2`,
      "true-false",
      quiz.trueFalse,
      [{ id: "true", text: "True" }, { id: "false", text: "False" }],
      quiz.trueAnswer ? "true" : "false",
      quiz.trueExplanation,
    ),
    question(
      `${lesson.slug}-q3`,
      "code-output",
      `What is printed?\n\n${quiz.code}`,
      [{ id: "expected", text: quiz.output }, { id: "other", text: quiz.otherOutput }],
      "expected",
      quiz.codeExplanation,
    ),
    {
      questionKey: `${lesson.slug}-short-answer`,
      type: "short-answer",
      prompt: `In your own words: ${quiz.shortAnswerPrompt || spec.selfCheckQuestions[0]}`,
      choices: [],
      requirements: ["Respond using your own words and refer to the concept in the prompt."],
      rubric: [quiz.shortAnswerRubric || "The response accurately explains the lesson concept and includes a relevant reason or example."],
      hints: ["Recall the key idea from the explanation before writing.", "A concise explanation plus a relevant example is enough."],
      explanation: "Short answers are saved for learner review and do not receive automatic correctness scoring.",
    },
  ];
  lesson.exercise = {
    language: "python",
    difficulty: spec.difficulty || "beginner",
    ...spec.exercise,
  };
  delete lesson.difficulty;
  delete lesson.references;
  lesson.content = {
    introduction: spec.introduction,
    objectives: spec.objectives,
    explanation: spec.explanation,
    terminology: spec.terminology,
    syntax: spec.syntax,
    codeExample: spec.codeExample,
    commonMistakes: spec.commonMistakes,
    bestPractices: spec.bestPractices,
    summary: spec.summary,
    selfCheckQuestions: spec.selfCheckQuestions,
    references: spec.references,
  };
  return lesson;
}

const modules = [
  {
    slug: "getting-started-with-python",
    title: "Getting Started with Python",
    summary: "Meet Python, prepare a Python 3.11+ workspace, run scripts, and learn the basic rules that make Python code readable.",
    objectives: [
      "Describe common uses of Python and identify a Python interpreter.",
      "Create and run a Python 3.11+ script in VS Code or a terminal.",
      "Read indentation, comments, names, and basic values in a short program.",
    ],
    lessons: [
      createLesson({
        slug: "what-python-is-and-where-it-is-used",
        title: "What Python Is and Where It Is Used",
        minutes: 45,
        introduction: "Python is a general-purpose programming language used for scripts, web services, data analysis, scientific work, and automation. In this lesson, distinguish the language from the applications built with it and read a tiny program as a sequence of instructions.",
        objectives: ["Describe Python as a general-purpose language.", "Name three areas where Python is used and one limitation to consider.", "Trace the order of statements in a short script."],
        explanation: [
          "A programming language gives people a way to express instructions that an interpreter or compiler can translate into actions. Python emphasizes readable syntax, but readable code still needs clear names, tests, and attention to edge cases. Python itself is not a web framework, a spreadsheet, or an AI model; those are tools and applications written with Python.",
          "Python is commonly used for command-line automation, backend web services, data analysis, and machine learning. It is not automatically the best tool for every job: mobile interfaces, hard real-time systems, or performance-critical loops may need other technologies. A useful first program performs one visible action so you can connect source code to behavior.",
        ],
        terminology: [{ term: "Interpreter", definition: "A program that reads and executes Python source code." }, { term: "Script", definition: "A file containing instructions that Python can run." }],
        syntax: "print(value)\n# A comment explains intent to a reader",
        codeExample: { code: 'print("Python can automate a repeated report.")\nprint("The program runs these statements in order.")', output: "Python can automate a repeated report.\nThe program runs these statements in order.", lines: ["Each call to print displays one value.", "The second statement runs after the first." ] },
        commonMistakes: ["Assuming that knowing Python automatically teaches the APIs of every Python library.", "Expecting a script to infer missing requirements instead of defining its input and output."],
        bestPractices: ["Start with a small, testable goal and make the result visible.", "Check the documentation and limitations of each library you choose."],
        summary: "Python is a general-purpose language. A script is a sequence of instructions, and the right tool depends on the problem and its constraints.",
        selfCheckQuestions: ["Could you describe the input and output of a tiny script?", "Which library documentation would you consult before using an unfamiliar package?"],
        references: [{ title: "Python Tutorial: Whetting Your Appetite", url: PYTHON_TUTORIAL }, { title: "Harvard CS50P", url: "https://cs50.harvard.edu/python/" }],
        exercise: { title: "Map a small automation task", instructions: "Write a short plan for one repeated task you can safely automate. Name the input, two processing steps, and the expected output. Do not include passwords or private data.", starterCode: "# Input:\n# Processing step 1:\n# Processing step 2:\n# Expected output:\n", hints: ["Choose a task with a clear beginning and end.", "Make the output something another person can inspect."], selfChecks: ["The plan has a specific input.", "The steps are ordered and observable.", "The output can be checked without guessing."], solutionCode: "# Input: a folder of monthly, non-sensitive CSV reports\n# Processing step 1: read each file and validate its header\n# Processing step 2: total the numeric amount column\n# Expected output: a new summary CSV and a count of skipped files", solutionExplanation: "This example defines a bounded input, validation, transformation, and reviewable output. A real program would also handle missing files and invalid numeric values." },
        quiz: { prompt: "Which statement best describes Python?", choices: [{ id: "a", text: "A general-purpose programming language used to build many kinds of tools." }, { id: "b", text: "A database that stores every Python program." }, { id: "c", text: "A web framework that only creates web pages." }], answer: "a", explanation: "Python is a general-purpose language. Frameworks and libraries built for Python add specialized capabilities.", trueFalse: "Python can be used to write command-line automation scripts.", trueAnswer: true, trueExplanation: "The Python standard library and third-party packages support automation, among many other uses.", code: 'print("first")\nprint("second")', output: "first, then second on a new line", otherOutput: "second, then first", codeExplanation: "Statements execute top to bottom unless control flow changes their order." },
      }),
      createLesson({
        slug: "install-python-and-set-up-vs-code",
        title: "Install Python 3.11+ and Set Up VS Code",
        minutes: 60,
        introduction: "A predictable development environment prevents confusing version and package errors. Install a supported Python 3.11-or-newer interpreter, select it in VS Code, and verify the version from the terminal before writing a project.",
        objectives: ["Verify that the active interpreter is Python 3.11 or newer.", "Select an interpreter in VS Code.", "Create a project folder and an isolated virtual environment."],
        explanation: [
          "Install Python using the official downloads for your operating system or an approved package manager. In VS Code, install the Python extension published by Microsoft, open a project folder, and select the intended interpreter. The editor extension provides language features; it does not replace the interpreter itself.",
          "A virtual environment keeps a project's installed packages separate from other projects. Create it from the project directory with `python -m venv .venv`, then activate it using the command appropriate for your shell. Verify the selected interpreter with `python --version`; if `python` is not recognized, consult your operating system's PATH and launcher guidance rather than guessing at installation paths.",
        ],
        terminology: [{ term: "Interpreter", definition: "The executable that runs a Python program." }, { term: "Virtual environment", definition: "An isolated project environment for Python packages." }],
        syntax: "python --version\npython -m venv .venv\n# Select .venv as the VS Code interpreter",
        codeExample: { code: "import sys\n\nif sys.version_info >= (3, 11):\n    print(\"Python 3.11+\")\nelse:\n    print(\"Upgrade Python\")", output: "Python 3.11+", lines: ["The sys module exposes interpreter information.", "Version tuples compare major and minor values in order.", "This example accepts Python 3.11 and every newer version." ] },
        commonMistakes: ["Installing an interpreter but selecting a different one in VS Code.", "Installing project packages globally instead of inside the project's virtual environment."],
        bestPractices: ["Verify the version from the same terminal and interpreter you will use for the project.", "Keep each project's environment and dependency list with that project."],
        summary: "Python 3.11+ and the VS Code Python extension are separate pieces. Select and verify one interpreter, then isolate project dependencies in a virtual environment.",
        selfCheckQuestions: ["Can you show which Python executable VS Code selected?", "What command creates a virtual environment?"],
        references: [{ title: "Python Setup and Usage", url: "https://docs.python.org/3/using/index.html" }, { title: "VS Code Python Environments", url: "https://code.visualstudio.com/docs/python/environments" }],
        exercise: { title: "Record a verified project setup", instructions: "Create a project folder and virtual environment on your own computer. Record the Python version and the command you used to activate the environment. Do not submit a screenshot containing usernames or local paths.", starterCode: "# Python version:\n# Environment folder:\n# Activation command for my shell:\n", hints: ["Run python --version in the project terminal.", "The activation command differs between PowerShell, Command Prompt, and POSIX shells."], selfChecks: ["Python reports version 3.11 or newer.", "VS Code uses the project's .venv interpreter.", "The environment can be activated again from the project folder."], solutionCode: "# Example on Windows PowerShell\npython --version\npython -m venv .venv\n.venv\\Scripts\\Activate.ps1", solutionExplanation: "The activation path shown is for Windows PowerShell only. Other shells use a different activation script; the Python documentation lists the correct command for each platform." },
        quiz: { prompt: "What is the main purpose of a virtual environment?", choices: [{ id: "a", text: "To isolate a project's installed packages." }, { id: "b", text: "To turn Python code into a web page." }, { id: "c", text: "To guarantee that a program contains no bugs." }], answer: "a", explanation: "A virtual environment separates project dependencies from other Python environments; it cannot guarantee correctness.", trueFalse: "The VS Code Python extension and Python interpreter are the same software component.", trueAnswer: false, trueExplanation: "The extension adds editor support. A separately installed interpreter executes Python programs.", code: "import sys\nprint(sys.version_info.major)", output: "3", otherOutput: "11", codeExplanation: "For Python 3.11, `major` is 3 and `minor` is 11." },
      }),
      createLesson({
        slug: "run-python-programs",
        title: "Run Python Programs",
        minutes: 45,
        introduction: "You can explore expressions in the interactive prompt or save a reusable program in a `.py` file. Learn how to run each form and recognize the difference between source code, a command, and its output.",
        objectives: ["Run a statement in the Python interactive prompt.", "Save and execute a `.py` file from the project environment.", "Use printed output to check a program's behavior."],
        explanation: [
          "The interactive prompt evaluates input as you enter it and is useful for quick experiments. A script stores multiple statements in a file so the same instructions can be run again. Save source files with a `.py` extension, then run them from the project directory with `python filename.py` or use VS Code's run command after confirming its selected interpreter.",
          "A terminal command starts the interpreter with a file. The program's output appears in the terminal, while error messages usually include the exception type and a line number. Keep the current working directory in mind: relative file paths are interpreted from that directory, not automatically from the source file's location.",
        ],
        terminology: [{ term: "Interactive prompt", definition: "A session where Python evaluates expressions entered one at a time." }, { term: "Working directory", definition: "The directory a process treats as the starting point for relative paths." }],
        syntax: "python hello.py\n>>> 2 + 3\n5",
        codeExample: { code: "message = \"Hello from a saved script.\"\nprint(message)", output: "Hello from a saved script.", lines: ["The assignment stores text in a variable.", "The next line displays that value." ] },
        commonMistakes: ["Typing `>>>` from a tutorial into a normal `.py` file; those characters mark the prompt, not Python syntax.", "Running a relative file path from a directory other than the project folder."],
        bestPractices: ["Save a small script and run it from a known project directory.", "Read the first useful line of a traceback and compare it with the source."],
        summary: "The prompt is for quick experiments; `.py` files are reusable programs. Run scripts with the intended interpreter and understand the current working directory.",
        selfCheckQuestions: ["Can you run the same saved script twice?", "Where does a relative file path start?"],
        references: [{ title: "Python Tutorial: Using the Interpreter", url: "https://docs.python.org/3/tutorial/interpreter.html" }, { title: "Harvard CS50P: Functions and Variables", url: "https://cs50.harvard.edu/python/2022/" }],
        exercise: { title: "Create a two-line greeting script", instructions: "Save a `.py` file that stores a greeting in a variable and prints it. Run it from the project terminal and compare the output with your expected result.", starterCode: "greeting = \"TODO\"\nprint(greeting)\n", hints: ["Replace TODO with a quoted string.", "Run the file using the interpreter selected for this project."], selfChecks: ["The file ends in .py.", "It runs without an exception.", "The terminal prints the intended greeting once."], solutionCode: "greeting = \"Hello, Python learner!\"\nprint(greeting)", solutionExplanation: "The first line assigns a string to a name; the second passes that value to print. The script can be rerun without retyping the statements." },
        quiz: { prompt: "Which is the usual way to run a saved file named `hello.py` from a terminal?", choices: [{ id: "a", text: "python hello.py" }, { id: "b", text: "print hello.py" }, { id: "c", text: "import hello.py" }], answer: "a", explanation: "The Python interpreter is invoked with the script filename. The exact launcher may differ by operating system, but `python hello.py` is the standard form when `python` points to the intended interpreter.", trueFalse: "The `>>>` prompt marker is normally typed into a `.py` source file.", trueAnswer: false, trueExplanation: "Tutorials use `>>>` to indicate interactive input. It is not part of the Python statement.", code: 'print("A")\nprint("B")', output: "A, then B on separate lines", otherOutput: "B, then A on separate lines", codeExplanation: "The interpreter executes these top-level statements in source order." },
      }),
      createLesson({
        slug: "syntax-comments-and-names",
        title: "Syntax, Indentation, Comments, and Names",
        minutes: 55,
        introduction: "Python uses indentation to mark code blocks, so whitespace is part of program structure. Learn to read comments and choose names that explain what a value represents.",
        objectives: ["Indent a block consistently to show its structure.", "Use comments to explain intent rather than restate code.", "Choose descriptive variable names using common Python conventions."],
        explanation: [
          "A colon starts an indented suite after constructs such as `if`, `for`, `while`, and `def`. All statements in the same suite should use consistent indentation; four spaces is the common convention. A missing or inconsistent indent can raise `IndentationError` or change which statements belong to a block.",
          "A comment begins with `#` and continues to the end of its line. Use comments for context, assumptions, or non-obvious decisions. Variable names should communicate meaning; `total_price` is more useful than `tp`. Python names are case-sensitive, and `total_price` and `Total_Price` are different names.",
        ],
        terminology: [{ term: "Suite", definition: "A group of statements controlled by a compound statement such as `if` or `def`." }, { term: "Identifier", definition: "A name used for a variable, function, class, or other program object." }],
        syntax: "if condition:\n    # Explain a non-obvious decision\n    descriptive_name = value",
        codeExample: { code: "# Keep the discount rule explicit for later review.\nsubtotal = 80\nif subtotal >= 50:\n    discount = 5\nelse:\n    discount = 0\nprint(subtotal - discount)", output: "75", lines: ["The comment gives context for the rule.", "The four-space indentation places the assignment inside the selected branch.", "The final print runs after the branch finishes." ] },
        commonMistakes: ["Using tabs and spaces inconsistently within one block.", "Adding comments that repeat the exact statement while leaving important assumptions unexplained."],
        bestPractices: ["Use four spaces per indentation level and a consistent editor setting.", "Prefer descriptive `snake_case` names for variables and functions."],
        summary: "Indentation determines Python block structure. Comments explain context; descriptive, consistently formatted names make code easier to review.",
        selfCheckQuestions: ["Can you point to the statements that belong to a conditional block?", "Does a name explain the value it stores?"],
        references: [{ title: "Python Tutorial: An Informal Introduction", url: PYTHON_TUTORIAL }, { title: "PEP 8: Naming Conventions", url: PEP8 }],
        exercise: { title: "Repair a readable conditional", instructions: "Correct the indentation and replace unclear names in the starter snippet. Keep the behavior: print `eligible` when the score is at least 60, otherwise print `retry`.", starterCode: "score=72\nif score >= 60:\nprint(\"eligible\")\nelse:\nprint(\"retry\")\n", hints: ["Indent each branch body one level.", "Use a descriptive name such as `score` and add a space around assignment operators."], selfChecks: ["Each branch body is indented consistently.", "The program prints eligible for score 72.", "Changing the score to 40 prints retry."], solutionCode: "score = 72\n\nif score >= 60:\n    print(\"eligible\")\nelse:\n    print(\"retry\")", solutionExplanation: "The colon starts each branch suite. Indenting print statements places them inside their respective branches. The comparison determines which single branch runs." },
        quiz: { prompt: "What does indentation determine after an `if` statement?", choices: [{ id: "a", text: "Which statements belong to the conditional suite." }, { id: "b", text: "The type of every variable." }, { id: "c", text: "The order of imported modules." }], answer: "a", explanation: "Python uses indentation to group statements in a suite. It is part of the syntax, not merely visual formatting.", trueFalse: "Python treats `total` and `Total` as the same identifier.", trueAnswer: false, trueExplanation: "Python identifiers are case-sensitive, so the two names refer to different identifiers.", code: "if True:\n    print(\"inside\")\nprint(\"outside\")", output: "inside, then outside", otherOutput: "outside only", codeExplanation: "The first print is indented into the suite; the final print is at the top level and runs afterward." },
      }),
      createLesson({
        slug: "values-and-basic-data-types",
        title: "Variables and Basic Data Types",
        minutes: 60,
        introduction: "Programs store and transform values. Learn to bind a name to a value, inspect its type, and distinguish numbers, text, booleans, and the absence value `None`.",
        objectives: ["Assign and reassign a variable name.", "Identify `int`, `float`, `str`, `bool`, and `NoneType` values.", "Use `type()` and `isinstance()` to inspect values when debugging."],
        explanation: [
          "An assignment such as `count = 3` binds the name `count` to an integer value. A later assignment can bind that name to another value. Python is dynamically typed: names do not need a declared type, but each value still has a type that affects which operations make sense.",
          "`int` represents whole numbers, `float` represents floating-point numbers, `str` represents text, and `bool` is `True` or `False`. `None` represents an intentionally absent value. Use `type(value)` for inspection and `isinstance(value, SomeType)` when checking behavior; avoid relying on type-name strings in application logic.",
        ],
        terminology: [{ term: "Value", definition: "A piece of data a program can use, such as a number, string, or boolean." }, { term: "Dynamic typing", definition: "The type belongs to a value at runtime rather than being fixed by a declaration for the variable name." }],
        syntax: "count = 3\nprice = 2.5\nlabel = \"items\"\nready = True\nresult = None",
        codeExample: { code: "quantity = 3\nunit_price = 2.5\nlabel = \"notebooks\"\nready = quantity > 0\nprint(type(quantity).__name__, type(unit_price).__name__)\nprint(label, ready)", output: "int float\nnotebooks True", lines: ["Assignments bind names to values.", "The comparison produces a boolean.", "`type(...).__name__` is used here for learning output; program logic should generally check behavior instead." ] },
        commonMistakes: ["Writing `True` or `None` in lowercase; those are case-sensitive built-in constants.", "Assuming `input()` returns a number instead of text."],
        bestPractices: ["Choose values whose types match the domain and validate external input.", "Use `None` to mean no value only when that meaning is clear."],
        summary: "Names reference values, and each value has a runtime type. Know the common built-in types and validate data that enters a program.",
        selfCheckQuestions: ["What type does `input()` return?", "When could `None` be more meaningful than an empty string?"],
        references: [{ title: "Python Tutorial: Using Python as a Calculator", url: "https://docs.python.org/3/tutorial/introduction.html" }],
        exercise: { title: "Describe a simple order", instructions: "Create variables for a product name, quantity, unit price, and whether the order is ready. Print each value alongside its type name. Use at least one integer, one float, one string, and one boolean.", starterCode: "product_name = \"TODO\"\nquantity = 0\nunit_price = 0.0\nready = False\n\n# Print each value and type.\n", hints: ["Use `type(value).__name__` to display the type during this exercise.", "Keep the boolean value unquoted so it is a bool rather than text."], selfChecks: ["The product is a str.", "The quantity is an int and price is a float.", "The ready value is a bool."], solutionCode: "product_name = \"Notebook\"\nquantity = 3\nunit_price = 2.5\nready = True\n\nfor value in (product_name, quantity, unit_price, ready):\n    print(value, type(value).__name__)", solutionExplanation: "A tuple groups the sample values for iteration. Each value keeps its own type; the loop prints the value and a readable type name." },
        quiz: { prompt: "Which built-in type represents a whole number such as 12?", choices: [{ id: "a", text: "int" }, { id: "b", text: "str" }, { id: "c", text: "NoneType" }], answer: "a", explanation: "An integer value uses `int`. A quoted value such as `\"12\"` is instead a string.", trueFalse: "The expression `3 > 2` produces a bool value.", trueAnswer: true, trueExplanation: "A comparison evaluates to either `True` or `False`, both of type bool.", code: "value = 4\nprint(type(value).__name__)", output: "int", otherOutput: "str", codeExplanation: "The unquoted literal `4` is an integer." },
      }),
    ],
  },
  {
    slug: "values-decisions-and-strings",
    title: "Values, Decisions, and Strings",
    summary: "Convert and display input, calculate with operators, manipulate text, and choose a path with conditional logic.",
    objectives: ["Convert input text deliberately and report invalid values clearly.", "Use operators and string methods to transform values.", "Build readable conditional branches for multiple cases."],
    lessons: [
      createLesson({
        slug: "input-output-and-type-conversion",
        title: "Input, Output, and Type Conversion",
        minutes: 55,
        introduction: "`input()` gives a program text typed by a person, while `print()` displays a result. Convert that text to a number only after deciding how invalid or empty input should be handled.",
        objectives: ["Collect text with `input()` and display results with `print()`.", "Convert numeric text with `int()` or `float()`.", "Explain why conversion can fail and where to handle that failure."],
        explanation: [
          "The `input(prompt)` function displays a prompt and returns the entered characters as a string. Even when a person types digits, the result is still text. Use `int()` for whole-number input and `float()` for decimal input; conversion should follow validation rather than be assumed to succeed.",
          "Use `print()` with multiple values or an f-string to make output readable. For a beginner program, `try`/`except ValueError` can report malformed numeric input. Avoid silently replacing invalid input with zero: that can make a wrong calculation appear valid.",
        ],
        terminology: [{ term: "Conversion", definition: "Creating a value of another type from an existing value when the conversion is valid." }, { term: "f-string", definition: "A string literal prefixed with `f` that can include expressions inside braces." }],
        syntax: "name = input(\"Name: \")\ncount = int(input(\"Count: \"))\nprint(f\"{name}: {count}\")",
        codeExample: { code: "price_text = \"12.50\"\nprice = float(price_text)\nquantity = 2\nprint(f\"Total: {price * quantity:.2f}\")", output: "Total: 25.00", lines: ["The text is converted to a float.", "Multiplication calculates the total.", "The format specifier displays two digits after the decimal point." ] },
        commonMistakes: ["Adding numeric strings and expecting numeric addition: `\"2\" + \"3\"` joins text.", "Assuming conversion succeeds for empty text or words such as `many`."],
        bestPractices: ["Validate external input and catch the specific conversion error.", "Format output for the person who needs to use it."],
        summary: "Input arrives as text. Convert it explicitly, handle invalid values, and format output so the result is understandable.",
        selfCheckQuestions: ["Why does `input()` need conversion before numeric addition?", "Which exception does `int(\"many\")` raise?"],
        references: [{ title: "Python Tutorial: Input and Output", url: PYTHON_FILES }],
        exercise: { title: "Calculate a ticket total", instructions: "Ask for a quantity in a local script, convert it to an integer, and calculate the total for a ticket priced at 8.50. Display the result with two decimal places. Add a message for invalid numeric input.", starterCode: "ticket_price = 8.50\nquantity_text = input(\"Ticket quantity: \")\n# Convert, calculate, and display the total.\n", hints: ["Put the conversion and calculation inside a `try` block.", "Catch `ValueError` and print a short correction message."], selfChecks: ["Input 2 displays 17.00.", "Input `many` displays an error message rather than a traceback.", "The program does not silently treat bad input as zero."], solutionCode: "ticket_price = 8.50\nquantity_text = input(\"Ticket quantity: \")\n\ntry:\n    quantity = int(quantity_text)\n    if quantity < 0:\n        print(\"Quantity cannot be negative.\")\n    else:\n        total = ticket_price * quantity\n        print(f\"Total: {total:.2f}\")\nexcept ValueError:\n    print(\"Enter a whole-number quantity.\")", solutionExplanation: "The code converts text inside a try block, rejects negative quantities, and formats the total to two decimal places. `ValueError` handles text that is not an integer." },
        quiz: { prompt: "What type does `input()` return?", choices: [{ id: "a", text: "str" }, { id: "b", text: "int" }, { id: "c", text: "bool" }], answer: "a", explanation: "`input()` returns the entered characters as a string, even if they look numeric.", trueFalse: "`int(\"7\")` converts valid whole-number text to an integer.", trueAnswer: true, trueExplanation: "The string contains valid integer digits, so conversion succeeds and returns the integer value 7.", code: "value = float(\"2.5\")\nprint(value * 2)", output: "5.0", otherOutput: "2.52", codeExplanation: "The text is converted to a floating-point number before multiplication." },
      }),
      createLesson({
        slug: "operators-and-expressions",
        title: "Operators and Expressions",
        minutes: 50,
        introduction: "Operators combine values to form expressions. Learn arithmetic, comparison, and logical operators, and use parentheses to make intended grouping clear.",
        objectives: ["Use arithmetic operators and distinguish `/`, `//`, and `%`.", "Compare values with relational operators.", "Combine conditions with `and`, `or`, and `not`."],
        explanation: [
          "Arithmetic operators include `+`, `-`, `*`, `/`, `//`, `%`, and `**`. `/` performs true division, `//` floors a quotient, and `%` returns a remainder. Operator precedence determines evaluation order; parentheses make non-obvious expressions explicit.",
          "Comparison operators produce booleans. Logical `and` requires both expressions to be true, `or` requires at least one, and `not` reverses a truth value. Python short-circuits logical expressions, so the second operand may not run if the first already determines the result.",
        ],
        terminology: [{ term: "Expression", definition: "A combination of values and operators that Python evaluates to a value." }, { term: "Short-circuit evaluation", definition: "Evaluation that stops once the result of a logical expression is determined." }],
        syntax: "remainder = total % divisor\nwithin_range = 0 <= score <= 100\nallowed = is_member and not is_blocked",
        codeExample: { code: "minutes = 135\nhours = minutes // 60\nremaining_minutes = minutes % 60\nprint(hours, remaining_minutes)", output: "2 15", lines: ["Floor division finds the number of complete hours.", "The remainder operator finds minutes left over.", "The two results are printed separated by a space." ] },
        commonMistakes: ["Using `/` when an integer quotient is required.", "Omitting parentheses from a complex expression and misreading precedence."],
        bestPractices: ["Use parentheses when they clarify intent, even if precedence would make them optional.", "Test boundary values for comparisons and ranges."],
        summary: "Arithmetic, comparison, and logical operators produce values that can be combined. Know division behavior and make grouping readable.",
        selfCheckQuestions: ["What is the difference between `//` and `%`?", "When does `and` skip evaluating its second expression?"],
        references: [{ title: "Python Tutorial: Operators", url: "https://docs.python.org/3/tutorial/introduction.html#numbers" }],
        exercise: { title: "Split a duration into hours and minutes", instructions: "Convert a non-negative number of minutes into complete hours and remaining minutes. Display both values and verify the output for 135 minutes.", starterCode: "total_minutes = 135\n# Calculate whole hours and remaining minutes.\n", hints: ["Use floor division for complete hours.", "Use the remainder operator for minutes left over."], selfChecks: ["135 minutes becomes 2 hours and 15 minutes.", "60 minutes becomes 1 hour and 0 minutes.", "The result uses integer values."], solutionCode: "total_minutes = 135\nhours = total_minutes // 60\nremaining_minutes = total_minutes % 60\nprint(f\"{hours} hours and {remaining_minutes} minutes\")", solutionExplanation: "Floor division counts complete groups of 60; modulo returns the remainder. Together they reconstruct the original duration." },
        quiz: { prompt: "What does `17 % 5` evaluate to?", choices: [{ id: "a", text: "2" }, { id: "b", text: "3" }, { id: "c", text: "3.4" }], answer: "a", explanation: "Five fits into seventeen three times with a remainder of two.", trueFalse: "`and` returns true only when both operands are truthy.", trueAnswer: true, trueExplanation: "The logical `and` operation requires both operands to be truthy for a truthy result.", code: "print(17 // 5, 17 % 5)", output: "3 2", otherOutput: "3.4 0", codeExplanation: "Floor division returns the whole quotient; modulo returns the remainder." },
      }),
      createLesson({
        slug: "strings-and-string-methods",
        title: "Strings and String Methods",
        minutes: 60,
        introduction: "Strings represent text. Learn to join and format strings, select characters with indexes and slices, and use methods that return transformed strings without changing the original.",
        objectives: ["Index and slice a string safely.", "Use common methods such as `strip`, `lower`, `split`, and `replace`.", "Build readable output with f-strings."],
        explanation: [
          "A string is an immutable sequence of Unicode characters. Indexing starts at zero; a negative index counts from the end. Slices use a start-inclusive, stop-exclusive range, so `text[0:3]` selects the first three characters. Accessing an index that does not exist raises `IndexError`.",
          "Methods such as `strip()`, `lower()`, and `replace()` return a new string. They do not modify the original because strings are immutable. Use `split()` to divide text and `join()` to combine pieces with a chosen separator. Treat untrusted text as data and do not evaluate it as Python source.",
        ],
        terminology: [{ term: "Immutable", definition: "An object whose contents cannot be changed in place after it is created." }, { term: "Slice", definition: "A selected range from a sequence, with the stop index excluded." }],
        syntax: "cleaned = raw_text.strip().lower()\nparts = cleaned.split(\",\")\nmessage = f\"Found {len(parts)} items\"",
        codeExample: { code: "raw_name = \"  Ada LOVELACE  \"\nname = raw_name.strip().title()\nprint(name)\nprint(raw_name)", output: "Ada Lovelace\n  Ada LOVELACE  ", lines: ["`strip()` returns a string without surrounding whitespace.", "`title()` returns a title-cased string.", "The original value remains unchanged." ] },
        commonMistakes: ["Expecting `lower()` or `strip()` to mutate a string in place.", "Forgetting that a slice's stop index is excluded."],
        bestPractices: ["Normalize user-entered text at a clear input boundary.", "Guard indexes or use slices when input length may vary."],
        summary: "Strings are immutable sequences. Indexing, slicing, and methods create useful views or new strings; keep the original value in mind.",
        selfCheckQuestions: ["What characters does `text[1:4]` select?", "Does `strip()` change the original string?"],
        references: [{ title: "Python Tutorial: Text Sequences", url: "https://docs.python.org/3/tutorial/introduction.html#strings" }],
        exercise: { title: "Normalize a display name", instructions: "Given a display name with accidental spaces and mixed casing, create a cleaned version and print a greeting. Do not change the original variable.", starterCode: "raw_name = \"  mAYA CHEN  \"\n# Create a cleaned name and print a greeting.\n", hints: ["Use `strip()` to remove outside whitespace.", "Use `title()` or another explicit casing method on the returned string."], selfChecks: ["The greeting contains `Maya Chen`.", "The raw string still contains its original spaces and capitalization.", "The program uses an f-string or clear concatenation."], solutionCode: "raw_name = \"  mAYA CHEN  \"\nclean_name = raw_name.strip().title()\nprint(f\"Welcome, {clean_name}!\")", solutionExplanation: "String methods return new values. The code stores the cleaned result separately and uses it to form readable output." },
        quiz: { prompt: "Why does `text.strip()` not change `text` in place?", choices: [{ id: "a", text: "Strings are immutable, so the method returns a new string." }, { id: "b", text: "String methods only work inside loops." }, { id: "c", text: "Python deletes every string after printing it." }], answer: "a", explanation: "Strings are immutable. Assign the returned value if you want to keep the transformed string.", trueFalse: "In `word[1:4]`, index 4 is included in the slice.", trueAnswer: false, trueExplanation: "The stop index is excluded; the slice includes indexes 1, 2, and 3.", code: 'text = "python"\nprint(text[1:4])', output: "yth", otherOutput: "ytho", codeExplanation: "The slice starts at index 1 and stops before index 4." },
      }),
      createLesson({
        slug: "conditional-statements",
        title: "Conditional Statements",
        minutes: 55,
        introduction: "Programs make decisions by evaluating conditions. Use `if`, `elif`, and `else` to select one branch, and order conditions so specific cases are not hidden by broader ones.",
        objectives: ["Write a condition using comparison and logical operators.", "Choose among branches with `if`/`elif`/`else`.", "Test boundary and mutually exclusive cases."],
        explanation: [
          "An `if` statement evaluates a condition and runs its indented suite when the result is truthy. `elif` checks another condition only if earlier conditions were false. `else` handles the remaining case. At most one branch in an if/elif/else chain executes.",
          "Order matters. If a broad condition appears first, it may capture values intended for a more specific branch. Test values just below, at, and just above a threshold. Use `and`, `or`, and `not` to combine conditions; use parentheses when they clarify the intended grouping.",
        ],
        terminology: [{ term: "Condition", definition: "An expression evaluated for truthiness to decide which branch runs." }, { term: "Branch", definition: "A possible block of statements selected by control flow." }],
        syntax: "if condition:\n    statement\nelif another_condition:\n    statement\nelse:\n    statement",
        codeExample: { code: "temperature = 18\nif temperature < 10:\n    label = \"cold\"\nelif temperature < 25:\n    label = \"mild\"\nelse:\n    label = \"warm\"\nprint(label)", output: "mild", lines: ["Python checks conditions from top to bottom.", "The first true branch assigns the label.", "Later branches are skipped after a match." ] },
        commonMistakes: ["Using `=` assignment where a comparison `==` was intended.", "Placing a broad condition before a specific condition that it already includes."],
        bestPractices: ["Test thresholds at the boundary, one value below, and one value above.", "Keep each branch focused on one understandable decision."],
        summary: "Conditionals select one path based on truthy expressions. Order branches carefully and test boundary values.",
        selfCheckQuestions: ["Which branch runs when multiple conditions could be true?", "How would you test a score threshold of 60?"],
        references: [{ title: "Python Tutorial: if Statements", url: PYTHON_CONTROL_FLOW }],
        exercise: { title: "Classify a score", instructions: "Classify a score from 0 to 100 as `needs practice` (<60), `meets standard` (60-84), or `strong` (85+). Print a clear message and consider invalid scores.", starterCode: "score = 78\n# Validate the range, then select and print a category.\n", hints: ["Check the overall valid range before assigning a category.", "Use `elif` for the middle interval so it is checked only after the first case fails."], selfChecks: ["Score 59 is needs practice.", "Score 60 is meets standard.", "Score 85 is strong and score 101 is rejected."], solutionCode: "score = 78\nif not 0 <= score <= 100:\n    print(\"Score must be from 0 to 100.\")\nelif score < 60:\n    print(\"needs practice\")\nelif score < 85:\n    print(\"meets standard\")\nelse:\n    print(\"strong\")", solutionExplanation: "The range check runs first so invalid input cannot be classified. The later thresholds are mutually exclusive because each previous condition has already failed." },
        quiz: { prompt: "Which statement starts an additional condition after an earlier `if` condition is false?", choices: [{ id: "a", text: "elif" }, { id: "b", text: "catch" }, { id: "c", text: "repeat" }], answer: "a", explanation: "`elif` adds a conditional branch to an if/elif/else chain.", trueFalse: "In one if/elif/else chain, Python can run more than one selected branch.", trueAnswer: false, trueExplanation: "The chain executes the suite for the first true condition, or the else suite if none match.", code: "score = 90\nif score >= 60:\n    result = \"pass\"\nelse:\n    result = \"retry\"\nprint(result)", output: "pass", otherOutput: "retry", codeExplanation: "A score of 90 satisfies the first condition, so the else suite is skipped." },
      }),
    ],
  },
  {
    slug: "loops-and-collections",
    title: "Loops and Collections",
    summary: "Repeat work safely and choose lists, tuples, sets, and dictionaries to represent related data.",
    objectives: ["Use `for` and `while` loops with clear termination.", "Control a loop with `break` and `continue` and recognize `pass`.", "Choose and operate on the four core collection types."],
    lessons: [
      createLesson({
        slug: "for-loops-and-range",
        title: "For Loops and `range()`",
        minutes: 55,
        introduction: "A `for` loop processes each item in an iterable. Use it when the values to visit are known or when a collection already provides the sequence.",
        objectives: ["Iterate over a string or list with `for`.", "Use `range()` for a sequence of integers.", "Avoid off-by-one errors by checking range boundaries."],
        explanation: ["A `for` loop assigns each next item to its loop variable and runs the indented suite. When iterating a list, the loop visits its items in order. Prefer iterating over the values themselves instead of indexing when the index is not needed.", "`range(stop)` starts at zero and stops before `stop`. `range(start, stop, step)` lets you choose bounds and step size. An empty range is valid and runs zero times. If you need both positions and items, use `enumerate()` rather than manually maintaining a counter."],
        terminology: [{ term: "Iterable", definition: "An object that can provide its items one at a time, such as a list, string, or range." }, { term: "Iteration", definition: "One pass that obtains the next item and runs the loop body." }],
        syntax: "for item in items:\n    process(item)\n\nfor number in range(1, stop):\n    print(number)",
        codeExample: { code: "scores = [70, 85, 90]\ntotal = 0\nfor score in scores:\n    total += score\nprint(total)", output: "245", lines: ["The loop visits each score once.", "The augmented assignment adds the current score to total.", "The final value is printed after the loop." ] },
        commonMistakes: ["Expecting the stop value in `range()` to be included.", "Changing a collection while iterating over it and skipping or revisiting items."],
        bestPractices: ["Iterate over collection values unless indexes are genuinely needed.", "Use `enumerate()` when both an index and item are required."],
        summary: "For loops process iterable values in order. `range()` is stop-exclusive; choose clear bounds and avoid mutating the collection being traversed.",
        selfCheckQuestions: ["How many values are in `range(2, 6)`?", "What does `enumerate()` provide?"],
        references: [{ title: "Python Tutorial: for Statements", url: PYTHON_CONTROL_FLOW }],
        exercise: { title: "Total a list of expenses", instructions: "Loop through a list of expense amounts and calculate the total. Print the total and the number of entries. Try the empty-list case as well.", starterCode: "expenses = [12.5, 8.0, 4.5]\ntotal = 0.0\n# Loop through expenses and calculate the total.\n", hints: ["Initialize the accumulator before the loop.", "Use `len(expenses)` for the number of entries; it is zero for an empty list."], selfChecks: ["The sample total is 25.0.", "The count matches the number of list items.", "An empty list produces a total of 0.0."], solutionCode: "expenses = [12.5, 8.0, 4.5]\ntotal = 0.0\nfor amount in expenses:\n    total += amount\nprint(f\"Total: {total:.2f}\")\nprint(f\"Entries: {len(expenses)}\")", solutionExplanation: "The accumulator starts with a numeric zero, then adds each amount. `len` reports the number of source entries and handles an empty list." },
        quiz: { prompt: "Does `range(2, 6)` include 6?", choices: [{ id: "a", text: "No; the stop value is excluded." }, { id: "b", text: "Yes; the stop value is included." }, { id: "c", text: "It contains only 2 and 6." }], answer: "a", explanation: "The stop argument is exclusive, so the values are 2, 3, 4, and 5.", trueFalse: "A `for` loop can iterate over the items in a string.", trueAnswer: true, trueExplanation: "Strings are iterable sequences of characters.", code: "print(list(range(3)))", output: "[0, 1, 2]", otherOutput: "[1, 2, 3]", codeExplanation: "A one-argument range starts at zero and stops before its argument." },
      }),
      createLesson({
        slug: "while-loops-and-termination",
        title: "While Loops and Termination",
        minutes: 55,
        introduction: "A `while` loop repeats as long as a condition is true. Its condition and update must work together so the loop eventually stops.",
        objectives: ["Write a while loop with an explicit condition.", "Update loop state so the loop makes progress.", "Trace a loop and identify whether it terminates."],
        explanation: ["Python checks the condition before each iteration. If it is false at the start, the body runs zero times. A counter, input state, or other value in the condition must change when necessary; otherwise an infinite loop can consume resources and never reach later code.", "Use `while` for repetition that depends on a condition or sentinel value. When a fixed set of items is available, a `for` loop is usually clearer. Keep the state update visible and test the initial, stopping, and one-step-before-stopping cases."],
        terminology: [{ term: "Sentinel", definition: "A special value used to signal that input or repetition should stop." }, { term: "Loop invariant", definition: "A property that remains true at a defined point during each iteration." }],
        syntax: "while condition:\n    update_state\n    process_state",
        codeExample: { code: "remaining = 3\nwhile remaining > 0:\n    print(remaining)\n    remaining -= 1\nprint(\"Go\")", output: "3\n2\n1\nGo", lines: ["The loop continues while remaining is positive.", "Subtracting one guarantees progress toward the stopping condition.", "The final print runs after the condition becomes false." ] },
        commonMistakes: ["Forgetting to update a value used by the condition.", "Updating state before processing it and accidentally skipping the first intended value."],
        bestPractices: ["Write down the stopping condition and what changes each iteration.", "Use a `for` loop for a fixed sequence instead of rebuilding its iteration logic."],
        summary: "A while loop checks a condition before every pass. Ensure the loop changes state so it reaches a clear stopping condition.",
        selfCheckQuestions: ["What value changes in the example loop?", "What would happen if the decrement were removed?"],
        references: [{ title: "Python Tutorial: while Statements", url: PYTHON_CONTROL_FLOW }],
        exercise: { title: "Count down to zero", instructions: "Print the values from a chosen positive integer down to 1, then print `Done`. Ensure the loop terminates and decide what to do if the starting value is zero or negative.", starterCode: "count = 4\nwhile count > 0:\n    # Print the current value and update it.\n    pass\nprint(\"Done\")\n", hints: ["The loop condition should match the positive values you want to print.", "Change count inside the loop so it approaches zero."], selfChecks: ["Starting at 4 prints 4, 3, 2, 1, then Done.", "Starting at 0 does not enter the loop.", "The counter changes each iteration."], solutionCode: "count = 4\nwhile count > 0:\n    print(count)\n    count -= 1\nprint(\"Done\")", solutionExplanation: "The condition excludes zero. The decrement guarantees that each pass gets closer to termination; zero input skips the loop body." },
        quiz: { prompt: "When is a `while` loop condition checked?", choices: [{ id: "a", text: "Before each iteration." }, { id: "b", text: "Only after the loop ends." }, { id: "c", text: "Only once when the file is loaded." }], answer: "a", explanation: "Python checks the condition before entering every iteration, including the first one.", trueFalse: "A while loop can run zero times if its initial condition is false.", trueAnswer: true, trueExplanation: "The condition is checked first, so a false initial value skips the body.", code: "count = 0\nwhile count > 0:\n    count -= 1\nprint(count)", output: "0", otherOutput: "-1", codeExplanation: "The condition is false at the start, so the loop body is never entered." },
      }),
      createLesson({
        slug: "break-continue-and-pass",
        title: "`break`, `continue`, and `pass`",
        minutes: 45,
        introduction: "Loop-control statements change what happens during an iteration. Use them deliberately: `break` exits the nearest loop, `continue` starts its next iteration, and `pass` is an intentional no-op placeholder.",
        objectives: ["Use `break` to stop searching after a match.", "Use `continue` to skip the rest of an iteration.", "Explain why `pass` does not skip or exit a loop."],
        explanation: ["`break` immediately exits the nearest enclosing loop. It is useful when a search has found what it needs. `continue` skips the remaining statements in the current iteration and returns to the loop condition or next item.", "`pass` does nothing. It can keep a syntactically required block in place while you are sketching structure, but it does not continue to the next loop iteration. Replace placeholders before considering a program complete, and prefer a clear condition over deeply nested loop-control statements."],
        terminology: [{ term: "Nearest enclosing loop", definition: "The innermost active loop affected by `break` or `continue`." }, { term: "No-op", definition: "An operation that intentionally makes no change." }],
        syntax: "for item in items:\n    if should_stop(item):\n        break\n    if should_skip(item):\n        continue\n    process(item)",
        codeExample: { code: "for number in range(1, 6):\n    if number == 3:\n        continue\n    print(number)", output: "1\n2\n4\n5", lines: ["The loop visits numbers from 1 through 5.", "When number is 3, continue skips the print for that iteration.", "The remaining values are printed." ] },
        commonMistakes: ["Using `pass` when you intend to skip the current iteration; `continue` is the control-flow statement for that.", "Using `break` in nested loops and assuming it exits every enclosing loop."],
        bestPractices: ["Use a named condition to make why a loop stops or skips an item clear.", "Keep `break` and `continue` close to the condition that explains them."],
        summary: "`break` exits the nearest loop, `continue` skips to its next iteration, and `pass` is a no-op placeholder.",
        selfCheckQuestions: ["Which keyword skips only the current iteration?", "Does `break` exit one loop or every nested loop?"],
        references: [{ title: "Python Tutorial: break and continue", url: PYTHON_CONTROL_FLOW }],
        exercise: { title: "Find the first available seat", instructions: "Scan a list of seat labels and print the first label that is not reserved. Stop scanning after the first available seat. If every seat is reserved, print a fallback message.", starterCode: "seats = [\"A1 reserved\", \"A2 reserved\", \"A3 available\"]\n# Find and print the first available seat.\n", hints: ["Use a loop and test whether the label ends with `available`.", "Use `break` after printing a match; track whether any match was found."], selfChecks: ["The example prints A3 available once.", "The loop stops after the first available seat.", "A list with no available seat prints the fallback message."], solutionCode: "seats = [\"A1 reserved\", \"A2 reserved\", \"A3 available\"]\nfound = False\nfor seat in seats:\n    if seat.endswith(\"available\"):\n        print(seat)\n        found = True\n        break\nif not found:\n    print(\"No seats available\")", solutionExplanation: "The boolean records whether a match was found. `break` prevents later entries from being processed after the first match; the fallback runs only when no match was seen." },
        quiz: { prompt: "Which statement skips the remainder of the current iteration and continues the loop?", choices: [{ id: "a", text: "continue" }, { id: "b", text: "pass" }, { id: "c", text: "break" }], answer: "a", explanation: "`continue` starts the next iteration. `pass` does nothing, and `break` exits the nearest loop.", trueFalse: "`break` exits the nearest enclosing loop.", trueAnswer: true, trueExplanation: "A break statement terminates the nearest active loop, not every enclosing loop.", code: "for number in range(3):\n    if number == 1:\n        break\n    print(number)", output: "0", otherOutput: "0 then 2", codeExplanation: "The loop exits when number becomes 1, so that value and later values are not printed." },
      }),
      createLesson({
        slug: "lists-and-list-methods",
        title: "Lists and List Methods",
        minutes: 60,
        introduction: "Lists store an ordered, changeable sequence. Learn to access items, update values, add or remove items, and avoid changing a list in surprising ways while iterating.",
        objectives: ["Create, index, slice, and update a list.", "Use common list methods such as `append`, `extend`, `insert`, and `remove`.", "Explain list mutability and choose a safe iteration pattern."],
        explanation: ["List indexes start at zero and negative indexes count from the end. Lists are mutable: assignment to an index and methods such as `append()` change the existing list. `append(value)` adds one item; `extend(iterable)` adds each item from another iterable.", "`remove(value)` removes the first matching value and raises `ValueError` if no match exists. `pop()` removes and returns an item. Avoid removing elements from a list while iterating over that same list; build a new filtered list or iterate over a copy when appropriate."],
        terminology: [{ term: "Mutable", definition: "An object whose contents can be changed after it is created." }, { term: "Index", definition: "A zero-based position used to access an item in a sequence." }],
        syntax: "items = [\"pen\", \"book\"]\nitems.append(\"folder\")\nfirst = items[0]",
        codeExample: { code: "tasks = [\"read\", \"review\"]\ntasks.append(\"practice\")\ntasks[0] = \"read notes\"\nprint(tasks)", output: "['read notes', 'review', 'practice']", lines: ["The list starts with two ordered items.", "append adds one item to the end.", "Index assignment updates the first item." ] },
        commonMistakes: ["Confusing `append([a, b])`, which adds one nested list, with `extend([a, b])`, which adds two items.", "Accessing an index that is outside the list's current range."],
        bestPractices: ["Use methods that match the intended operation and note whether they mutate in place.", "Prefer a new filtered list when removing multiple matching items."],
        summary: "Lists are ordered and mutable. Indexes, slices, and methods provide ways to inspect and update them; understand which methods change the list.",
        selfCheckQuestions: ["What is the difference between append and extend?", "Why can removal during iteration skip an item?"],
        references: [{ title: "Python Tutorial: Data Structures", url: PYTHON_DATA_STRUCTURES }],
        exercise: { title: "Maintain a reading list", instructions: "Start with a list of three book titles. Add one title, replace a misspelled title, and remove one title only if it exists. Print the final list in order.", starterCode: "books = [\"North Wind\", \"Small Worlds\", \"Green City\"]\n# Update the list and print it.\n", hints: ["Use append to add the new title.", "Check membership before calling remove so an absent title does not raise ValueError."], selfChecks: ["The new title appears once at the end.", "The corrected title replaces the misspelled entry.", "Removing a missing title does not crash the program."], solutionCode: "books = [\"North Wind\", \"Small Worlds\", \"Green City\"]\nbooks.append(\"Quiet River\")\nbooks[1] = \"Small Worlds, Revised\"\nto_remove = \"Green City\"\nif to_remove in books:\n    books.remove(to_remove)\nprint(books)", solutionExplanation: "The example uses append for one new item, index assignment for a correction, and membership testing before removal. The list preserves its order." },
        quiz: { prompt: "What does `append(value)` do to a list?", choices: [{ id: "a", text: "Adds one item to the end." }, { id: "b", text: "Sorts the list." }, { id: "c", text: "Returns a new tuple." }], answer: "a", explanation: "`append` mutates the list by adding one item at its end.", trueFalse: "Lists can be changed after they are created.", trueAnswer: true, trueExplanation: "Lists are mutable sequences; items can be added, removed, or replaced.", code: "items = [1, 2]\nitems.append(3)\nprint(len(items))", output: "3", otherOutput: "2", codeExplanation: "Append adds one item, increasing the list length by one." },
      }),
      createLesson({
        slug: "tuples-and-fixed-records",
        title: "Tuples and Fixed Records",
        minutes: 40,
        introduction: "Tuples represent ordered groups of values that should not be changed in place. Learn tuple syntax, unpacking, and when a tuple communicates a fixed record more clearly than a list.",
        objectives: ["Create tuples, including a one-item tuple.", "Unpack a tuple into named variables.", "Choose between a tuple and a list based on whether the sequence should change."],
        explanation: ["Parentheses commonly group tuple values, but commas create the tuple. A single value needs a trailing comma: `(5,)`; `(5)` is just the integer 5. Tuples support indexing and slicing like other sequences, but do not support item assignment.", "Tuple unpacking assigns corresponding values to names in one statement. The number of target names should match the number of values unless starred unpacking is used. Tuples can communicate a fixed group such as coordinates; use a dataclass or named structure when fields need descriptive names."],
        terminology: [{ term: "Tuple", definition: "An ordered, immutable sequence of values." }, { term: "Unpacking", definition: "Assigning items from an iterable to multiple variables." }],
        syntax: "point = (4, 7)\nx, y = point\nsingle_item = (5,)",
        codeExample: { code: "coordinates = (4, 7)\nx, y = coordinates\nprint(f\"x={x}, y={y}\")", output: "x=4, y=7", lines: ["The tuple stores two ordered values.", "Unpacking assigns them to x and y in order.", "The f-string labels each value." ] },
        commonMistakes: ["Writing `(5)` when a one-item tuple `(5,)` is intended.", "Trying to assign to a tuple position."],
        bestPractices: ["Use tuples for small fixed groups and unpack them into meaningful names.", "Use a dataclass or dictionary when a record's fields need self-describing labels."],
        summary: "Tuples are ordered and immutable. Commas define tuple structure, and unpacking can make small fixed records readable.",
        selfCheckQuestions: ["Why is the comma needed in `(5,)`?", "When is a dataclass clearer than a tuple?"],
        references: [{ title: "Python Tutorial: Tuples and Sequences", url: PYTHON_DATA_STRUCTURES }],
        exercise: { title: "Unpack a coordinate", instructions: "Store a two-dimensional point in a tuple, unpack it into x and y, and calculate the point's translated position after moving it 2 units right and 3 units up.", starterCode: "point = (4, 7)\n# Unpack and calculate translated coordinates.\n", hints: ["Unpack the tuple with `x, y = point`.", "Translation adds the horizontal and vertical offsets separately."], selfChecks: ["The original point remains unchanged.", "The translated point is (6, 10).", "The result is represented as a two-item tuple."], solutionCode: "point = (4, 7)\nx, y = point\ntranslated = (x + 2, y + 3)\nprint(translated)", solutionExplanation: "Unpacking binds the coordinate components to descriptive names. A new tuple stores the translated result, leaving the original point unchanged." },
        quiz: { prompt: "Which syntax creates a tuple containing one integer?", choices: [{ id: "a", text: "(5,)" }, { id: "b", text: "(5)" }, { id: "c", text: "[5]" }], answer: "a", explanation: "The comma creates the one-item tuple. Parentheses alone do not turn an expression into a tuple.", trueFalse: "Tuple items can be reassigned by index after the tuple is created.", trueAnswer: false, trueExplanation: "Tuples are immutable; create a new tuple if a different value is needed.", code: "x, y = (2, 9)\nprint(y)", output: "9", otherOutput: "2", codeExplanation: "Unpacking assigns the first value to x and the second to y." },
      }),
      createLesson({
        slug: "sets-and-unique-values",
        title: "Sets and Unique Values",
        minutes: 45,
        introduction: "A set stores unique hashable values and supports fast membership checks. Use sets to reason about uniqueness and relationships, not when display order is important.",
        objectives: ["Create a set and add or remove values.", "Use membership checks and set operations.", "Explain why a set removes duplicates and does not provide sequence indexing."],
        explanation: ["A set keeps at most one copy of each hashable value. Create an empty set with `set()`; `{}` creates an empty dictionary. Use `add()` for one item and `update()` for multiple items. Sets do not support positions such as index zero.", "Union combines values, intersection keeps shared values, and difference keeps values present in one set but not another. Sets are useful for membership and uniqueness; sort explicitly if you need deterministic display order."],
        terminology: [{ term: "Unique", definition: "Present only once in a collection, regardless of how many duplicates were provided." }, { term: "Hashable", definition: "A value with a stable hash that can be used in a set or as a dictionary key." }],
        syntax: "unique_tags = set(tags)\nunique_tags.add(\"python\")\nshared = first_set & second_set",
        codeExample: { code: "attendees = {\"Ari\", \"Bo\", \"Ari\"}\nprint(len(attendees))\nprint(\"Bo\" in attendees)", output: "2\nTrue", lines: ["The duplicate name is stored only once.", "len reports the number of unique values.", "The `in` operator checks membership." ] },
        commonMistakes: ["Using `{}` for an empty set; that literal creates an empty dictionary.", "Depending on set iteration order for a user-facing sequence."],
        bestPractices: ["Choose a set when uniqueness or membership matters.", "Sort a set before displaying values when deterministic ordering is required."],
        summary: "Sets store unique hashable values and support membership and relationship operations. They are not indexed sequences.",
        selfCheckQuestions: ["How do you create an empty set?", "Which operation returns only values shared by two sets?"],
        references: [{ title: "Python Tutorial: Sets", url: PYTHON_DATA_STRUCTURES }],
        exercise: { title: "Compare two workshop rosters", instructions: "Given two participant lists, report everyone who attended both sessions, everyone in either session, and the number of unique attendees.", starterCode: "morning = [\"Ari\", \"Bo\", \"Dee\"]\nafternoon = [\"Bo\", \"Dee\", \"Kai\"]\n# Use sets to calculate overlap and combined attendance.\n", hints: ["Convert each list to a set first.", "Use intersection for overlap and union for everyone in either set."], selfChecks: ["The overlap is Bo and Dee.", "The union contains five unique names.", "Sort values before printing if order matters."], solutionCode: "morning = {\"Ari\", \"Bo\", \"Dee\"}\nafternoon = {\"Bo\", \"Dee\", \"Kai\"}\nprint(\"Both:\", sorted(morning & afternoon))\nprint(\"Either:\", sorted(morning | afternoon))\nprint(\"Unique count:\", len(morning | afternoon))", solutionExplanation: "Intersection finds shared values; union combines unique values. Sorting makes the displayed result predictable." },
        quiz: { prompt: "Which literal creates an empty set?", choices: [{ id: "a", text: "set()" }, { id: "b", text: "{}" }, { id: "c", text: "[]" }], answer: "a", explanation: "`set()` creates an empty set. `{}` is reserved for an empty dictionary literal.", trueFalse: "A set can contain the same hashable value multiple times as separate items.", trueAnswer: false, trueExplanation: "A set stores unique values, so repeated equal values collapse to one member.", code: "values = {2, 2, 3}\nprint(len(values))", output: "2", otherOutput: "3", codeExplanation: "The duplicate 2 is stored once, so the set contains two unique members." },
      }),
      createLesson({
        slug: "dictionaries-and-keyed-data",
        title: "Dictionaries and Keyed Data",
        minutes: 60,
        introduction: "Dictionaries map unique keys to values. They are useful for records, lookups, and counting when a descriptive key is more meaningful than a numeric position.",
        objectives: ["Create, read, update, and remove dictionary entries.", "Use `get()` or membership checks to handle missing keys.", "Iterate through keys, values, and key-value pairs."],
        explanation: ["A dictionary maps hashable keys to values. Use square brackets to read or assign a known key; reading a missing key with brackets raises `KeyError`. `get(key, default)` returns a fallback without adding the key. Keys are unique, and assigning an existing key replaces its value.", "`items()` provides key-value pairs for iteration; `keys()` and `values()` provide views. Use a dictionary when data is naturally looked up by a meaningful key. For repeated structured records, consider a list of dictionaries or a dataclass depending on the operations needed."],
        terminology: [{ term: "Key-value pair", definition: "A dictionary entry connecting a unique key with a value." }, { term: "KeyError", definition: "An exception raised when a requested dictionary key is missing." }],
        syntax: "profile = {\"name\": \"Ari\", \"active\": True}\nname = profile.get(\"name\", \"Unknown\")",
        codeExample: { code: "stock = {\"pens\": 12, \"books\": 4}\nstock[\"folders\"] = 6\nfor item, amount in stock.items():\n    print(item, amount)", output: "pens 12\nbooks 4\nfolders 6", lines: ["The dictionary maps item names to counts.", "Assignment adds a new key-value pair.", "items() lets the loop unpack each pair." ] },
        commonMistakes: ["Assuming reading a missing key with brackets returns `None`; it raises `KeyError`.", "Using a mutable list or dictionary as a key."],
        bestPractices: ["Use `get()` when a missing key is an expected case.", "Choose keys that describe the value and document expected record shape."],
        summary: "Dictionaries map unique hashable keys to values. Use safe lookups for optional keys and `items()` to iterate over pairs.",
        selfCheckQuestions: ["What is the difference between `data[key]` and `data.get(key)` for a missing key?", "Why are dictionary keys required to be hashable?"],
        references: [{ title: "Python Tutorial: Dictionaries", url: PYTHON_DATA_STRUCTURES }],
        exercise: { title: "Summarize item counts", instructions: "Create a dictionary of item counts, add a new item, safely look up an item that may be missing, and print a readable summary of all entries.", starterCode: "counts = {\"pens\": 12, \"books\": 4}\n# Add folders, safely look up markers, and print all entries.\n", hints: ["Use assignment to add a key.", "Use `get` with a default value for an optional key."], selfChecks: ["The folders entry is present.", "A missing markers entry does not raise KeyError.", "The output includes each key and its count."], solutionCode: "counts = {\"pens\": 12, \"books\": 4}\ncounts[\"folders\"] = 6\nmarker_count = counts.get(\"markers\", 0)\nprint(f\"Markers: {marker_count}\")\nfor item, amount in counts.items():\n    print(f\"{item}: {amount}\")", solutionExplanation: "Assignment creates the new entry. `get` supplies a fallback without modifying the dictionary. `items()` iterates through each key and value." },
        quiz: { prompt: "What happens when `data[\"missing\"]` reads a key that is not present?", choices: [{ id: "a", text: "Python raises KeyError." }, { id: "b", text: "Python always returns zero." }, { id: "c", text: "Python creates the key automatically." }], answer: "a", explanation: "Bracket lookup requires the key to exist and raises `KeyError` otherwise. `get` is useful for an optional key.", trueFalse: "Dictionary keys must be unique within one dictionary.", trueAnswer: true, trueExplanation: "Assigning an existing key replaces its value; a dictionary has one value per key.", code: "stock = {\"pens\": 3}\nprint(stock.get(\"books\", 0))", output: "0", otherOutput: "KeyError", codeExplanation: "get returns its provided default for a missing key without raising KeyError." },
      }),
    ],
  },
  {
    slug: "functions-errors-and-files",
    title: "Functions, Errors, and Files",
    summary: "Break programs into reusable functions, organize imports, respond to errors deliberately, and work with files safely.",
    objectives: ["Define functions with clear inputs and return values.", "Organize code in modules and handle expected exceptions.", "Read and write text files using context managers and explicit encodings."],
    lessons: [
      createLesson({
        slug: "functions-and-parameters",
        title: "Functions and Parameters",
        minutes: 60,
        introduction: "Functions package a named task behind a reusable interface. Parameters let callers provide data, and a focused function is easier to test than duplicated logic.",
        objectives: ["Define and call a function with parameters.", "Use positional, keyword, and default arguments appropriately.", "Keep a function focused on one task."],
        explanation: ["A `def` statement creates a function. Its indented body runs when the function is called. Parameters are names in the definition; arguments are values supplied in the call. Positional arguments are matched by order, while keyword arguments make the destination explicit.", "Default values support an optional argument, but avoid mutable defaults such as a list because the same object is reused across calls. A function should have a clear purpose and predictable inputs. Define small helpers when they remove meaningful duplication or clarify an operation."],
        terminology: [{ term: "Parameter", definition: "A name in a function definition that receives an argument value." }, { term: "Argument", definition: "A value supplied to a function call." }],
        syntax: "def greet(name, punctuation=\"!\"):\n    return f\"Hello, {name}{punctuation}\"",
        codeExample: { code: "def area(width, height):\n    return width * height\n\nprint(area(4, 3))\nprint(area(height=5, width=2))", output: "12\n10", lines: ["The function receives two parameters.", "The return expression sends a result to the caller.", "Keyword arguments make the parameter mapping explicit." ] },
        commonMistakes: ["Using a mutable list as a default argument and sharing it across calls.", "Putting all application behavior into one long function."],
        bestPractices: ["Choose parameter names that clarify the function's contract.", "Use keyword arguments when they improve call-site readability."],
        summary: "Functions name reusable behavior. Parameters receive arguments; defaults should be immutable or created inside the function; return values communicate results.",
        selfCheckQuestions: ["Which term describes a value supplied in a call?", "Why is `items=[]` a risky default parameter?"],
        references: [{ title: "Python Tutorial: Defining Functions", url: PYTHON_CONTROL_FLOW }, { title: "Harvard CS50P: Functions and Variables", url: "https://cs50.harvard.edu/python/2022/" }],
        exercise: { title: "Create a reusable subtotal function", instructions: "Write a function that accepts a price and quantity and returns the subtotal. Add an optional discount rate defaulting to zero. Print results for the default and a supplied discount.", starterCode: "def subtotal(price, quantity, discount_rate=0):\n    # Calculate and return the discounted subtotal.\n    pass\n", hints: ["Multiply price by quantity before applying the discount.", "A rate of 0.10 represents ten percent; the retained fraction is 1 - rate."], selfChecks: ["subtotal(10, 2) returns 20.", "subtotal(10, 2, 0.10) returns 18.0.", "The function returns a value instead of printing it."], solutionCode: "def subtotal(price, quantity, discount_rate=0):\n    gross = price * quantity\n    return gross * (1 - discount_rate)\n\nprint(subtotal(10, 2))\nprint(subtotal(10, 2, 0.10))", solutionExplanation: "The function calculates a gross amount, then multiplies by the fraction remaining after the discount. The default makes the discount optional and zero by default." },
        quiz: { prompt: "In `def greet(name):`, what is `name`?", choices: [{ id: "a", text: "A parameter." }, { id: "b", text: "A required return value." }, { id: "c", text: "A module import." }], answer: "a", explanation: "`name` is a parameter in the function definition. A value passed during a call is an argument.", trueFalse: "A function can be called with a keyword argument such as `greet(name=\"Ari\")`.", trueAnswer: true, trueExplanation: "Keyword arguments name the parameter receiving the supplied value.", code: "def double(number):\n    return number * 2\nprint(double(4))", output: "8", otherOutput: "4", codeExplanation: "The caller passes 4, and the function returns twice that value." },
      }),
      createLesson({
        slug: "return-values-and-scope",
        title: "Return Values and Scope",
        minutes: 55,
        introduction: "A returned value travels from a function to its caller. Scope determines where a name can be used; local variables help keep functions independent and predictable.",
        objectives: ["Distinguish `return` from `print`.", "Identify local and global names in a short example.", "Pass values explicitly instead of relying on hidden global state."],
        explanation: ["`print()` displays a value; `return` sends a value back to the caller and ends the current function call. A function without a return statement returns `None`. The caller can store, combine, or test a returned value.", "A name assigned inside a function is local by default. Names from an enclosing scope may be read, but modifying global state with `global` often makes behavior harder to reason about. Pass needed data as parameters and return results explicitly to keep functions testable."],
        terminology: [{ term: "Return value", definition: "The value a function sends back to the expression that called it." }, { term: "Local scope", definition: "The part of a program where a name created inside a function is available." }],
        syntax: "def calculate(value):\n    result = value * 2\n    return result\nanswer = calculate(4)",
        codeExample: { code: "def add_tax(price, rate):\n    tax = price * rate\n    return price + tax\n\ntotal = add_tax(20, 0.1)\nprint(total)", output: "22.0", lines: ["price and rate are inputs to the function.", "tax is local to the function call.", "The returned total is assigned to the caller's name." ] },
        commonMistakes: ["Expecting a printed value to be available as the function result.", "Changing a global variable inside a helper instead of passing and returning values."],
        bestPractices: ["Return calculated results and keep display decisions at the caller when practical.", "Make dependencies explicit with parameters."],
        summary: "Return sends values to callers; print displays them. Local scope and explicit data flow keep functions easier to test.",
        selfCheckQuestions: ["What does a function return if it reaches its end without `return`?", "Why are explicit parameters easier to test than hidden global inputs?"],
        references: [{ title: "Python Tutorial: More on Defining Functions", url: PYTHON_CONTROL_FLOW }],
        exercise: { title: "Separate calculation from display", instructions: "Write a function that converts minutes to seconds and returns the result. In a separate caller statement, print the result with a label.", starterCode: "def to_seconds(minutes):\n    # Return the number of seconds.\n    pass\n\n# Call the function and display its result.\n", hints: ["There are 60 seconds in a minute.", "Return the product; use print at the call site."], selfChecks: ["to_seconds(3) returns 180.", "The function does not print internally.", "The caller can use the returned value in another expression."], solutionCode: "def to_seconds(minutes):\n    return minutes * 60\n\nseconds = to_seconds(3)\nprint(f\"Seconds: {seconds}\")", solutionExplanation: "The function returns a calculation without deciding how it is displayed. The caller stores the value and formats it." },
        quiz: { prompt: "What does `return` do in a function?", choices: [{ id: "a", text: "Sends a value back to the caller and ends that call." }, { id: "b", text: "Prints the value to the terminal only." }, { id: "c", text: "Imports a module." }], answer: "a", explanation: "Return provides the function result to the caller and exits that function call.", trueFalse: "A variable created inside a function is local to that function by default.", trueAnswer: true, trueExplanation: "Assignments inside a function create local names unless special scope declarations are used.", code: "def value():\n    print(3)\nresult = value()\nprint(result)", output: "3, then None", otherOutput: "3, then 3", codeExplanation: "The function prints 3 but has no return statement, so its return value is None." },
      }),
      createLesson({
        slug: "modules-and-imports",
        title: "Modules and Imports",
        minutes: 50,
        introduction: "A module is a Python file that can group related definitions. Imports let a project reuse code, while a main guard prevents script-only behavior from running during import.",
        objectives: ["Import a standard-library module and call one of its functions.", "Explain the difference between importing a module and importing a name.", "Use `if __name__ == \"__main__\"` for script entry behavior."],
        explanation: ["The standard library provides modules such as `math`, `statistics`, and `pathlib`. `import math` keeps the name's origin visible; `from math import sqrt` imports one name directly. Choose a style that remains clear and avoid naming a project file after a standard-library module.", "When Python imports a file, it executes its top-level statements. Keep reusable module definitions free of surprising side effects. Put command-line startup code in a `main()` function and call it only under the main guard so importing the module does not run the application."],
        terminology: [{ term: "Module", definition: "A Python file that can contain definitions and executable statements." }, { term: "Main guard", definition: "A conditional that runs a block only when the file is executed as the top-level program." }],
        syntax: "import statistics\n\ndef main():\n    print(statistics.mean([2, 4]))\n\nif __name__ == \"__main__\":\n    main()",
        codeExample: { code: "import math\n\nprint(math.ceil(2.2))", output: "3", lines: ["The import makes the math module available.", "The qualified name shows that ceil comes from math.", "ceil returns the smallest integer greater than or equal to the input." ] },
        commonMistakes: ["Naming a local file `math.py` and shadowing the standard library module.", "Putting application work at module top level so importing the file unexpectedly runs it."],
        bestPractices: ["Use descriptive filenames that do not collide with standard-library names.", "Keep reusable definitions import-safe and use a main guard for script startup."],
        summary: "Modules organize and reuse code. Imports execute top-level statements, so keep reusable files safe to import and guard application startup.",
        selfCheckQuestions: ["Why can a file named `statistics.py` cause import problems?", "When does a main guard call `main()`?"],
        references: [{ title: "Python Tutorial: Modules", url: "https://docs.python.org/3/tutorial/modules.html" }],
        exercise: { title: "Create an import-safe helper module", instructions: "Split a short temperature conversion helper into a reusable module and a script entry point. Importing the helper should define the function but should not print or prompt.", starterCode: "# temperature_tools.py\ndef celsius_to_fahrenheit(value):\n    # Return the converted temperature.\n    pass\n", hints: ["Keep the conversion function at module level.", "Place the print call in a separate script's main function and main guard."], selfChecks: ["The helper can be imported without output.", "celsius_to_fahrenheit(0) returns 32.0.", "Running the script displays the sample result."], solutionCode: "# temperature_tools.py\ndef celsius_to_fahrenheit(value):\n    return (value * 9 / 5) + 32\n\n# main.py\nfrom temperature_tools import celsius_to_fahrenheit\n\ndef main():\n    print(celsius_to_fahrenheit(0))\n\nif __name__ == \"__main__\":\n    main()", solutionExplanation: "The helper module contains only a reusable function. The script imports it and runs the example only when executed directly." },
        quiz: { prompt: "What is a main guard used for?", choices: [{ id: "a", text: "To run script entry behavior only when the file is executed directly." }, { id: "b", text: "To encrypt imported modules." }, { id: "c", text: "To prevent every import from loading." }], answer: "a", explanation: "The `__name__` guard distinguishes direct execution from importing the module.", trueFalse: "Importing a module executes its top-level statements.", trueAnswer: true, trueExplanation: "Python evaluates the module's top-level statements during import, which is why side effects should be controlled.", code: "import math\nprint(math.floor(3.8))", output: "3", otherOutput: "4", codeExplanation: "floor returns the greatest integer less than or equal to the value." },
      }),
      createLesson({
        slug: "exception-handling",
        title: "Exception Handling",
        minutes: 55,
        introduction: "Exceptions report conditions that interrupt normal execution. Handle expected failures at the boundary where the program can offer a useful next step, and let unexpected failures remain visible during development.",
        objectives: ["Read the exception type and traceback location.", "Use `try`/`except` for a specific expected exception.", "Use `else` or `finally` when their control-flow meaning is appropriate."],
        explanation: ["A traceback shows the call path that led to an exception. Start with the final exception type and message, then inspect the relevant source line. Common beginner exceptions include `ValueError` for a value of the wrong form, `TypeError` for an unsupported operation, and `FileNotFoundError` for a missing file.", "A try block holds operations that may fail; an except block handles a specific expected exception. Catching every exception can hide bugs. An optional else block runs when no exception was raised; finally runs whether an exception occurred or not, which is useful for cleanup when a context manager is not available."],
        terminology: [{ term: "Exception", definition: "An object representing an error or unusual condition during execution." }, { term: "Traceback", definition: "A report showing the call stack and location associated with an exception." }],
        syntax: "try:\n    value = int(text)\nexcept ValueError:\n    print(\"Enter a whole number.\")\nelse:\n    print(value)",
        codeExample: { code: "text = \"twelve\"\ntry:\n    number = int(text)\nexcept ValueError:\n    print(\"Please enter digits for a whole number.\")", output: "Please enter digits for a whole number.", lines: ["The conversion can raise ValueError.", "The matching except block handles that expected input problem.", "Other exception types are not silently swallowed." ] },
        commonMistakes: ["Using a bare `except` and hiding programming errors that should be fixed.", "Putting unrelated work inside a try block, making it unclear which operation failed."],
        bestPractices: ["Catch the narrow exception you expect and give a useful recovery message.", "Keep try blocks small and test both success and failure cases."],
        summary: "Tracebacks help locate failures. Handle expected exceptions narrowly and avoid hiding unknown defects.",
        selfCheckQuestions: ["Which exception is expected from converting `\"twelve\"` with `int()`?", "When does a finally block run?"],
        references: [{ title: "Python Tutorial: Errors and Exceptions", url: PYTHON_ERRORS }],
        exercise: { title: "Validate a whole-number quantity", instructions: "Write a small function that converts text to a non-negative integer. Return the integer for valid input and a clear message for invalid or negative input. Do not catch unrelated exceptions.", starterCode: "def parse_quantity(text):\n    # Convert and validate, handling ValueError.\n    pass\n", hints: ["Use `int(text)` inside a try block.", "Check whether the converted value is negative after conversion."], selfChecks: ["`\"4\"` returns the integer 4.", "`\"many\"` returns a useful error result.", "`\"-1\"` is rejected as a negative quantity."], solutionCode: "def parse_quantity(text):\n    try:\n        quantity = int(text)\n    except ValueError:\n        return \"Enter a whole number.\"\n    if quantity < 0:\n        return \"Quantity cannot be negative.\"\n    return quantity\n\nprint(parse_quantity(\"4\"))\nprint(parse_quantity(\"many\"))", solutionExplanation: "Only the conversion is inside the try block, and only ValueError is caught. A second check rejects negative values after conversion." },
        quiz: { prompt: "Which exception should normally be caught for `int(\"many\")`?", choices: [{ id: "a", text: "ValueError" }, { id: "b", text: "SyntaxError" }, { id: "c", text: "StopIteration" }], answer: "a", explanation: "The string is not a valid integer representation, so conversion raises ValueError.", trueFalse: "A bare `except` is usually the clearest way to handle one known input error.", trueAnswer: false, trueExplanation: "Catch a specific expected exception so unrelated bugs remain visible.", code: "try:\n    int(\"8\")\nexcept ValueError:\n    print(\"invalid\")\nelse:\n    print(\"valid\")", output: "valid", otherOutput: "invalid", codeExplanation: "The conversion succeeds, so the else block runs." },
      }),
      createLesson({
        slug: "file-handling-with-context-managers",
        title: "File Handling with Context Managers",
        minutes: 65,
        introduction: "Files let a program keep information beyond one run. Use `pathlib` for paths and a `with` block to open and close a file reliably, while selecting an encoding explicitly for text.",
        objectives: ["Read and write text files using `Path` and `open()`.", "Use a context manager to close files reliably.", "Handle missing files and avoid overwriting data unexpectedly."],
        explanation: ["`pathlib.Path` represents filesystem paths and offers methods such as `read_text()` and `write_text()`. For streaming or flexible modes, use `Path.open()`. A context manager written with `with` ensures the file is closed when the block ends, even if an exception occurs.", "Choose a mode deliberately: `r` reads, `w` creates or truncates, and `a` appends. For text, specify UTF-8 when it is the intended encoding. Relative paths start from the process working directory. Avoid writing to important files in examples; use a dedicated practice folder and make destructive modes explicit."],
        terminology: [{ term: "Context manager", definition: "An object used with `with` to manage setup and cleanup around a block." }, { term: "Encoding", definition: "A rule for translating text characters to and from bytes." }],
        syntax: "from pathlib import Path\npath = Path(\"notes.txt\")\nwith path.open(\"r\", encoding=\"utf-8\") as file:\n    text = file.read()",
        codeExample: { code: "from pathlib import Path\n\npractice_file = Path(\"practice-note.txt\")\npractice_file.write_text(\"Python practice\", encoding=\"utf-8\")\ntext = practice_file.read_text(encoding=\"utf-8\")\nprint(text)", output: "Python practice", lines: ["Path represents the practice file location.", "write_text creates or replaces the file contents, so use only a disposable practice file.", "read_text returns the saved text." ] },
        commonMistakes: ["Opening a file and forgetting to close it after an error.", "Using `w` mode on an important path and unintentionally truncating existing content."],
        bestPractices: ["Use `with` and explicit encoding for text files.", "Practice in a dedicated temporary directory and inspect the target path before writing."],
        summary: "Use Path objects and context managers to manage file access. Choose modes carefully, specify text encoding, and protect existing data.",
        selfCheckQuestions: ["Which file mode truncates existing content?", "What happens when a with block exits?"],
        references: [{ title: "Python Tutorial: Reading and Writing Files", url: PYTHON_FILES }, { title: "Python pathlib Documentation", url: "https://docs.python.org/3/library/pathlib.html" }],
        exercise: { title: "Create a disposable reading log", instructions: "In a dedicated practice directory, write a short line to `practice-log.txt`, read it back, and display it. Add a helpful message if the file is missing during the read step. Do not target an existing personal file.", starterCode: "from pathlib import Path\n\npractice_file = Path(\"practice-log.txt\")\n# Write, read, and display a disposable practice file.\n", hints: ["Use `write_text` and `read_text` with encoding=\"utf-8\".", "Handle `FileNotFoundError` narrowly around the read operation."], selfChecks: ["The file is created in the practice directory.", "The text read back matches the text written.", "The program gives a useful message if the file is absent."], solutionCode: "from pathlib import Path\n\npractice_file = Path(\"practice-log.txt\")\npractice_file.write_text(\"Reviewed loops today.\", encoding=\"utf-8\")\ntry:\n    text = practice_file.read_text(encoding=\"utf-8\")\nexcept FileNotFoundError:\n    print(\"Practice log was not found.\")\nelse:\n    print(text)", solutionExplanation: "The example uses a clearly named practice file and UTF-8 encoding. The read operation handles the specific missing-file case and displays text only on success." },
        quiz: { prompt: "Why use a `with` block when opening a file?", choices: [{ id: "a", text: "It ensures the file is closed when the block exits." }, { id: "b", text: "It automatically encrypts the file." }, { id: "c", text: "It prevents every possible file error." }], answer: "a", explanation: "The context manager handles cleanup and closes the file when control leaves the block, including exceptional exits.", trueFalse: "Opening a file with mode `w` can replace existing file contents.", trueAnswer: true, trueExplanation: "Write mode truncates an existing file, so use it only when replacing contents is intended.", code: "from pathlib import Path\np = Path(\"practice.txt\")\np.write_text(\"hello\", encoding=\"utf-8\")\nprint(p.read_text(encoding=\"utf-8\"))", output: "hello", otherOutput: "practice.txt", codeExplanation: "The text is written to and read from the same path; print displays the file contents." },
      }),
    ],
  },
  {
    slug: "object-oriented-python-and-projects",
    title: "Object-Oriented Python and Practical Projects",
    summary: "Model related data and behavior with classes, use instance attributes, protect invariants through methods, and bring core skills together in safe local projects.",
    objectives: ["Create and instantiate a simple class.", "Initialize per-instance data with `__init__`.", "Use methods to keep object state valid and build a complete local capstone."],
    lessons: [
      createLesson({
        slug: "classes-and-objects",
        title: "Classes and Objects",
        minutes: 55,
        introduction: "A class describes a kind of object and the behavior it offers. Create a class when related state and operations belong together; do not use classes merely to wrap every function.",
        objectives: ["Define a class and create an instance.", "Explain the relationship between a class and an object.", "Call an instance method and identify its receiver."],
        explanation: ["A class statement creates a new class object. Calling the class creates an instance. Methods are functions defined in the class body; an instance method receives the instance as its first parameter, conventionally named `self`.", "Objects are useful when a program needs multiple related values with behavior. Keep the public interface small and choose names that describe what an instance represents. For simple records with no custom behavior, a dictionary, tuple, or dataclass may be simpler."],
        terminology: [{ term: "Class", definition: "A definition describing the attributes and behavior of a kind of object." }, { term: "Instance", definition: "A particular object created from a class." }],
        syntax: "class Counter:\n    def next_value(self):\n        return 1\n\ncounter = Counter()",
        codeExample: { code: "class Greeter:\n    def greet(self, name):\n        return f\"Hello, {name}!\"\n\ngreeter = Greeter()\nprint(greeter.greet(\"Ari\"))", output: "Hello, Ari!", lines: ["The class defines a method.", "Calling Greeter creates an instance.", "Python passes the instance as self when the method is called." ] },
        commonMistakes: ["Calling an instance method on the class without supplying an instance.", "Forgetting `self` in an instance method definition."],
        bestPractices: ["Use a class when state and behavior meaningfully belong together.", "Keep method names and responsibilities focused."],
        summary: "Classes define a kind of object; instances hold particular state. Instance methods receive the instance through `self`.",
        selfCheckQuestions: ["What is created when a class is called?", "What does `self` refer to in an instance method?"],
        references: [{ title: "Python Tutorial: Classes", url: PYTHON_CLASSES }],
        exercise: { title: "Create a simple book record class", instructions: "Define a `Book` class with a method that returns a readable description. Create two instances and display each description.", starterCode: "class Book:\n    def describe(self):\n        # Return a description for this book.\n        pass\n\n", hints: ["A method can read attributes from `self`.", "Use an f-string to combine the title and author."], selfChecks: ["Each object can describe different book data.", "The method returns text rather than printing internally.", "The two instances do not share accidental data."], solutionCode: "class Book:\n    def __init__(self, title, author):\n        self.title = title\n        self.author = author\n\n    def describe(self):\n        return f\"{self.title} by {self.author}\"\n\nfirst = Book(\"Small Worlds\", \"M. Chen\")\nsecond = Book(\"North Wind\", \"A. Noor\")\nprint(first.describe())\nprint(second.describe())", solutionExplanation: "Each instance stores its own title and author. The method reads the instance attributes and returns a description for the caller." },
        quiz: { prompt: "What is an instance?", choices: [{ id: "a", text: "A particular object created from a class." }, { id: "b", text: "A Python comment." }, { id: "c", text: "A required module filename." }], answer: "a", explanation: "Calling a class creates an instance, which is a particular object of that class.", trueFalse: "An instance method conventionally receives the current instance as `self`.", trueAnswer: true, trueExplanation: "Python binds the instance to the first parameter when an instance method is called.", code: "class Marker:\n    pass\nitem = Marker()\nprint(isinstance(item, Marker))", output: "True", otherOutput: "False", codeExplanation: "item was created from Marker, so isinstance confirms it is an instance of that class." },
      }),
      createLesson({
        slug: "constructors-and-instance-attributes",
        title: "Constructors and Instance Attributes",
        minutes: 55,
        introduction: "The `__init__` method initializes a new instance. Store per-object values on `self` so two objects of the same class can keep independent state.",
        objectives: ["Define `__init__` with required parameters.", "Assign instance attributes through `self`.", "Explain why class attributes are shared while instance attributes belong to an object."],
        explanation: ["Python calls `__init__` after creating an instance. It initializes the instance; it is not the method that allocates the object itself. Parameters after `self` supply initial values, and assignments such as `self.title = title` store those values on that instance.", "A class attribute is defined in the class body and can be shared by instances. An instance attribute is stored on a particular instance. Use instance attributes for values that differ per object. Avoid mutable class attributes for per-instance collections, because instances could accidentally share the same list or dictionary."],
        terminology: [{ term: "Initializer", definition: "The `__init__` method that sets up a newly created instance." }, { term: "Instance attribute", definition: "A value stored on one particular object, commonly through `self.name`." }],
        syntax: "class Book:\n    def __init__(self, title):\n        self.title = title",
        codeExample: { code: "class Lamp:\n    def __init__(self, color):\n        self.color = color\n        self.is_on = False\n\nreading_lamp = Lamp(\"blue\")\nprint(reading_lamp.color, reading_lamp.is_on)", output: "blue False", lines: ["__init__ runs when Lamp is called.", "self.color stores data on this particular instance.", "Each new instance starts with its own is_on value." ] },
        commonMistakes: ["Writing `color = color` instead of assigning the parameter to `self.color`.", "Using a mutable class attribute for data that should belong to each instance."],
        bestPractices: ["Initialize required state in `__init__` so objects start valid.", "Prefer immutable defaults or create mutable values inside `__init__`."],
        summary: "`__init__` initializes an instance. Assign per-object state to `self` and avoid shared mutable defaults.",
        selfCheckQuestions: ["When is `__init__` called?", "Where should a different color for each lamp be stored?"],
        references: [{ title: "Python Tutorial: Class and Instance Variables", url: PYTHON_CLASSES }],
        exercise: { title: "Initialize a reusable timer record", instructions: "Create a `Timer` class that stores a label and a duration in seconds. Create two timers with different values and print both records.", starterCode: "class Timer:\n    def __init__(self, label, seconds):\n        # Store both values on this instance.\n        pass\n\n", hints: ["Assign parameters to `self.label` and `self.seconds`.", "A short method can format the two attributes for display."], selfChecks: ["Each Timer has its own label and seconds.", "Changing one instance does not change the other.", "The constructor receives initial state explicitly."], solutionCode: "class Timer:\n    def __init__(self, label, seconds):\n        self.label = label\n        self.seconds = seconds\n\n    def describe(self):\n        return f\"{self.label}: {self.seconds} seconds\"\n\nfocus = Timer(\"Focus\", 300)\nbreak_timer = Timer(\"Break\", 60)\nprint(focus.describe())\nprint(break_timer.describe())", solutionExplanation: "The constructor stores each argument on the newly created object. Each instance has its own values, and describe reads that state." },
        quiz: { prompt: "What is the primary purpose of `__init__`?", choices: [{ id: "a", text: "Initialize an instance after it is created." }, { id: "b", text: "Import a class from another module." }, { id: "c", text: "Delete the instance after every method call." }], answer: "a", explanation: "`__init__` sets up instance state when an object is created; it does not allocate the object itself.", trueFalse: "Assigning `self.name = name` stores a value on that instance.", trueAnswer: true, trueExplanation: "The assignment creates or updates an instance attribute on the current object.", code: "class Box:\n    def __init__(self, size):\n        self.size = size\nbox = Box(4)\nprint(box.size)", output: "4", otherOutput: "size", codeExplanation: "The constructor stores 4 in the instance attribute named size." },
      }),
      createLesson({
        slug: "encapsulation-and-valid-state",
        title: "Encapsulation Basics and Valid State",
        minutes: 55,
        introduction: "Encapsulation groups state with the operations that maintain it. Python conventions communicate intended privacy, while validation in methods protects important invariants.",
        objectives: ["Describe encapsulation as a design practice.", "Use a leading underscore to mark an internal implementation detail by convention.", "Validate updates so an object remains in an allowed state."],
        explanation: ["Python does not enforce private instance attributes in the same way some languages do. A leading underscore, such as `_balance`, communicates that callers should treat the name as internal. Double-leading underscores trigger name mangling for specific subclassing use cases; they are not a general security boundary.", "Encapsulation is about keeping related behavior and state together and offering operations that preserve rules. A method can reject an invalid update instead of letting every caller manipulate state inconsistently. Keep the public interface simple and document what each operation accepts and returns."],
        terminology: [{ term: "Encapsulation", definition: "A design practice that groups state and behavior and controls how state is changed." }, { term: "Invariant", definition: "A condition that should remain true for an object or system." }],
        syntax: "class Counter:\n    def __init__(self, start=0):\n        self._value = start\n\n    def increment(self):\n        self._value += 1",
        codeExample: { code: "class Counter:\n    def __init__(self, start=0):\n        self._value = start\n\n    def increment(self):\n        self._value += 1\n        return self._value\n\ncounter = Counter()\nprint(counter.increment())", output: "1", lines: ["The underscore indicates an internal-by-convention attribute.", "increment owns the update operation.", "The method returns the new value for the caller to use." ] },
        commonMistakes: ["Treating a leading underscore as a security mechanism that prevents access.", "Adding getters and setters for every attribute without a meaningful invariant."],
        bestPractices: ["Use methods to enforce meaningful rules, not to add ceremony.", "Document accepted values and raise a clear exception for invalid updates."],
        summary: "Encapsulation groups state and rule-preserving behavior. Python privacy markers are conventions; methods should protect meaningful invariants.",
        selfCheckQuestions: ["What does a leading underscore communicate?", "Why is it not a security boundary?"],
        references: [{ title: "Python Tutorial: Private Variables", url: PYTHON_CLASSES }],
        exercise: { title: "Protect a non-negative counter", instructions: "Add a method to a counter class that increases the value by a non-negative amount. Reject a negative amount with `ValueError`; do not expose a method that can silently make the value invalid.", starterCode: "class Counter:\n    def __init__(self, start=0):\n        self._value = start\n\n    def add(self, amount):\n        # Validate and update the internal value.\n        pass\n", hints: ["Check the amount before updating the state.", "Raise ValueError with a clear message when the amount is negative."], selfChecks: ["Adding 3 to a counter at 2 yields 5.", "Adding a negative amount raises ValueError.", "The internal attribute is marked with a leading underscore."], solutionCode: "class Counter:\n    def __init__(self, start=0):\n        if start < 0:\n            raise ValueError(\"start must be non-negative\")\n        self._value = start\n\n    def add(self, amount):\n        if amount < 0:\n            raise ValueError(\"amount must be non-negative\")\n        self._value += amount\n        return self._value\n\nprint(Counter(2).add(3))", solutionExplanation: "Both initialization and updates validate the invariant. The leading underscore marks the attribute as internal by convention; callers should use the method." },
        quiz: { prompt: "What does a leading underscore in a Python attribute name usually communicate?", choices: [{ id: "a", text: "The attribute is internal by convention." }, { id: "b", text: "The attribute is encrypted and inaccessible." }, { id: "c", text: "The attribute is always a class variable." }], answer: "a", explanation: "A leading underscore signals intended internal use, but Python does not make it a security boundary.", trueFalse: "A leading underscore makes an attribute impossible to access from outside the class.", trueAnswer: false, trueExplanation: "It is a convention, not access control. Callers should respect the interface, but the attribute remains accessible.", code: "class Counter:\n    def __init__(self):\n        self._value = 2\ncounter = Counter()\nprint(counter._value)", output: "2", otherOutput: "AttributeError", codeExplanation: "A leading underscore does not block access; it communicates that the attribute is intended for internal use." },
      }),
      createLesson({
        slug: "python-fundamentals-capstone",
        title: "Capstone: A Local Reading-List Manager",
        minutes: 150,
        introduction: "Bring variables, collections, functions, files, exceptions, and objects together in a small local application. Work in a dedicated practice directory and compare your behavior with the self-check list before revealing the reference solution.",
        objectives: ["Plan a small command-line program from requirements.", "Use a class to represent a reading item and functions to manage workflow.", "Persist JSON safely and handle missing or malformed data."],
        explanation: ["A capstone should combine familiar ideas rather than introduce many new ones at once. Start by writing down the input, state, actions, and output. A reading item can hold a title and completion state; a list can hold items; functions can add, list, and mark items; a JSON file can keep the list between runs.", "Use a dedicated practice folder and never overwrite a file that contains valuable personal data. Handle `FileNotFoundError` for a first run and `json.JSONDecodeError` for malformed existing content. Validate the loaded structure before using it. In this phase, students run and inspect the program locally; LearnHub only stores the self-check instructions and lesson completion, not a claim that the code was executed or verified."],
        terminology: [{ term: "Serialization", definition: "Converting program data into a format that can be stored or transferred, such as JSON." }, { term: "Capstone", definition: "A final project that combines skills learned across a course." }],
        syntax: "from pathlib import Path\nimport json\n\npath = Path(\"reading-list.json\")\nwith path.open(\"w\", encoding=\"utf-8\") as file:\n    json.dump(items, file, indent=2)",
        codeExample: { code: "import json\n\nitem = {\"title\": \"Small Worlds\", \"done\": False}\nencoded = json.dumps(item)\nprint(encoded)", output: '{"title": "Small Worlds", "done": false}', lines: ["A dictionary represents one record.", "json.dumps converts it to a JSON string.", "JSON uses lowercase true/false values in its serialized representation." ] },
        commonMistakes: ["Assuming a JSON file always exists or is always valid.", "Writing directly to an important file without a backup or disposable practice location."],
        bestPractices: ["Separate parsing, validation, state changes, and display into small functions.", "Test first-run, malformed-file, empty-list, and normal workflow cases."],
        summary: "The capstone combines data modeling, collections, functions, JSON, files, and exception handling. LearnHub does not run or grade the submitted Python code.",
        selfCheckQuestions: ["Can a first run work when no data file exists?", "What should happen if stored JSON is malformed?", "Have you run each workflow locally in a disposable practice directory?"],
        references: [{ title: "Python Tutorial: JSON and Structured Data", url: "https://docs.python.org/3/library/json.html" }, { title: "Harvard CS50P", url: "https://cs50.harvard.edu/python/" }, { title: "freeCodeCamp Python Learning", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/" }],
        exercise: { title: "Build and self-review a reading-list manager", difficulty: "intermediate", instructions: "Build a local command-line reading-list manager. It must list saved titles, add a title, mark a title complete, and save/load JSON in a dedicated practice directory. Run it locally with Python 3.11+; LearnHub does not execute or verify it.", starterCode: "from pathlib import Path\nimport json\n\nDATA_FILE = Path(\"reading-list-practice.json\")\n\nclass ReadingItem:\n    # Add instance attributes and a method.\n    pass\n\n# Add functions to load, save, list, add, and complete items.\n# Keep input handling separate from data operations.\n", hints: ["Start with a ReadingItem class and a function that loads a list from JSON.", "Handle a missing file as an empty list, then handle malformed JSON separately.", "Keep the menu loop small: parse one command, call a function, and display the result."], selfChecks: ["A first run starts with an empty list when the data file is absent.", "Adding a title persists it and the title appears after restart.", "Marking an unknown title reports a helpful message without crashing.", "Malformed JSON is reported and does not silently overwrite the file.", "The code runs locally with Python 3.11+ and all self-check cases were attempted."], solutionCode: "from pathlib import Path\nimport json\n\nDATA_FILE = Path(\"reading-list-practice.json\")\n\nclass ReadingItem:\n    def __init__(self, title, done=False):\n        self.title = title\n        self.done = done\n\n    def to_record(self):\n        return {\"title\": self.title, \"done\": self.done}\n\n    @classmethod\n    def from_record(cls, record):\n        if not isinstance(record, dict) or not isinstance(record.get(\"title\"), str):\n            raise ValueError(\"Each item needs a text title.\")\n        return cls(record[\"title\"], bool(record.get(\"done\", False)))\n\ndef load_items(path=DATA_FILE):\n    try:\n        raw = json.loads(path.read_text(encoding=\"utf-8\"))\n    except FileNotFoundError:\n        return []\n    except json.JSONDecodeError as error:\n        raise ValueError(\"The reading-list file contains invalid JSON.\") from error\n    if not isinstance(raw, list):\n        raise ValueError(\"The reading-list file must contain a list.\")\n    return [ReadingItem.from_record(record) for record in raw]\n\ndef save_items(items, path=DATA_FILE):\n    records = [item.to_record() for item in items]\n    path.write_text(json.dumps(records, indent=2), encoding=\"utf-8\")\n\ndef add_item(items, title):\n    cleaned = title.strip()\n    if not cleaned:\n        raise ValueError(\"A title cannot be empty.\")\n    items.append(ReadingItem(cleaned))\n\ndef mark_done(items, title):\n    for item in items:\n        if item.title.casefold() == title.strip().casefold():\n            item.done = True\n            return True\n    return False", solutionExplanation: "The example separates data operations from a menu, validates loaded JSON before using it, and treats a missing file as a first-run state. It raises a clear error for malformed or structurally invalid data. Run any menu wrapper in a local disposable directory and test the self-check cases; this reference is educational, not executed or verified by LearnHub." },
        project: {
          description: "Build a command-line reading-list manager that can add, list, complete, and persist items in a local JSON file.",
          learningObjectives: ["Model item state with a class and instance attributes.", "Use functions and collections to separate application operations.", "Read and write JSON while handling missing and malformed files."],
          requirements: ["Support adding and listing titles.", "Allow a title to be marked complete.", "Persist state in a dedicated local JSON file.", "Handle missing files and invalid JSON with clear messages.", "Keep the data operations separate from menu input/output."],
          steps: ["Write the item data model and its serialization methods.", "Implement and test loading and validation with temporary files.", "Implement add, list, and completion operations as functions.", "Connect the functions to a small command-line menu.", "Run the first-run, normal, unknown-title, and malformed-file checks."],
          expectedOutput: "A learner can run the local program, add two titles, mark one complete, restart, and see the saved state. Invalid JSON produces a clear error and is not silently overwritten.",
          solutionCode: READING_LIST_REFERENCE_SOLUTION,
          solutionExplanation: "This reference uses a class for item state, functions for each operation, JSON for persistence, and narrow error handling. Run it locally in a disposable practice folder. LearnHub does not execute or certify it.",
          evaluationChecklist: ["The learner can explain the class, functions, and data flow.", "The documented self-check cases were run locally.", "The project uses a disposable data file and does not overwrite unrelated user data."],
        },
        quiz: {
          prompt: "Which exception is appropriate to handle when a first-run JSON data file does not exist?",
          choices: [{ id: "a", text: "FileNotFoundError" }, { id: "b", text: "IndentationError" }, { id: "c", text: "ZeroDivisionError" }],
          answer: "a",
          explanation: "A first run can legitimately lack its data file, so handle FileNotFoundError as an empty initial state.",
          trueFalse: "Malformed JSON should be silently replaced with an empty list and overwritten without telling the learner.",
          trueAnswer: false,
          trueExplanation: "Malformed data should be reported and preserved for inspection rather than silently overwritten.",
          code: "import json\nprint(json.dumps({\"done\": False}))",
          output: '{"done": false}',
          otherOutput: '{"done": False}',
          codeExplanation: "JSON uses lowercase true and false literals even though Python uses True and False.",
        },
      }),
    ],
  },
];

module.exports = {
  contentVersion: 1,
  slug: "python-fundamentals",
  title: "Python Fundamentals",
  subtitle: "A complete beginner's path to writing, testing, and maintaining basic Python programs.",
  description: "Learn Python 3.11+ progressively through original explanations, runnable examples, local practice, quizzes, and a practical capstone. Python Web Development, Data Science, Machine Learning, AI and Deep Learning, and Automation remain future tracks that require completion of this path.",
  language: "English",
  subject: "python",
  trackKey: "fundamentals",
  trackOrder: 1,
  prerequisiteSlugs: [],
  estimatedHours: 42,
  minimumPythonVersion: "3.11",
  completionPolicy: "all-lessons-and-assessments",
  finalProjectModuleSlug: "object-oriented-python-and-projects",
  targetAudience: ["Complete beginners", "Learners with no prior programming experience"],
  modules,
};