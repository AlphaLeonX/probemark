# ProbeMark

Traceable temporary debug probes for VS Code — insert with source context, preview them, and safely remove only the probes created by this extension.

## Why ProbeMark?

Most log helpers make it easy to add logs. ProbeMark focuses on the full temporary-debug workflow:

- Insert language-aware debug probes with one shortcut
- Automatically attach file, line, and function context
- Mark generated probes with a visible `probemark:auto` marker
- Preview generated probes before removing them
- Remove only ProbeMark-generated probes, leaving hand-written logs untouched

## Usage

Place the cursor on a variable name, or select an expression, then press the default shortcut:

| Platform      | Shortcut   |
| ------------- | ---------- |
| macOS         | `Cmd + L`  |
| Windows/Linux | `Ctrl + L` |

ProbeMark detects the current file language and inserts a suitable debug statement on the next line with matching indentation.

## Context prefix

Every inserted probe carries a context prefix that tells you where it was generated:

```text
🧪 [FileName:LineNumber] FunctionName → variableName:
```

- `FileName` — basename of the source file
- `LineNumber` — frozen snapshot at insertion time; it does not auto-update
- `FunctionName` — detected via lightweight regex scanning; omitted if not found

Example:

```ts
console.log('🧪 [UserProfile.tsx:42] handleSubmit → userName:', userName); // probemark:auto
```

## Safe marker-based cleanup

ProbeMark appends a language-specific marker to every generated probe:

```ts
// probemark:auto
```

```py
# probemark:auto
```

Removal commands use this marker exclusively. They do not remove hand-written `console.log`, `print`, `var_dump`, `fmt.Println`, or business logging calls.

The marker is intentionally visible, grep-friendly, and easy to audit.

## Commands

| Command | Description |
| ------- | ----------- |
| **ProbeMark: Insert Debug Probe** | Insert a probe at the current cursor or selection |
| **ProbeMark: Preview Probes in Current File** | List generated probes with jump-to-line support |
| **ProbeMark: Remove Probes in Current File** | Remove generated probes in the current file after preview and confirmation |
| **ProbeMark: Remove Probes in Workspace** | Remove generated probes across the workspace after preview and confirmation |

All removal commands show a QuickPick preview and require explicit confirmation before modifying files.

## Supported languages

| Language | Template |
| -------- | -------- |
| JavaScript / JSX | `console.log('🧪 […] → var:', var); // probemark:auto` |
| TypeScript / TSX | `console.log('🧪 […] → var:', var); // probemark:auto` |
| Python | `print('🧪 […] → var:', var)  # probemark:auto` |
| Java | `System.out.println("🧪 […] → var: " + var); // probemark:auto` |
| PHP | `var_dump($var); // probemark:auto` |
| Go | `fmt.Println("🧪 […] → var:", var) // probemark:auto` |
| Other | `console.log('🧪 […] → var:', var); // probemark:auto` |

> **PHP note:** `var_dump` does not use a separate label argument in this version, so variable probes do not include the context prefix. Default PHP probes still include context, for example `var_dump('🧪 [File:Line] debug');`.

> **Go note:** ProbeMark inserts `fmt.Println(...)` but does not automatically add `import "fmt"`. Make sure the import exists when needed.

## Examples

### JavaScript — cursor on `userName` inside `handleSubmit`

```js
// Before
const handleSubmit = () => {
  const userName = 'Rose';
};

// After
const handleSubmit = () => {
  const userName = 'Rose';
  console.log('🧪 [UserProfile.tsx:42] handleSubmit → userName:', userName); // probemark:auto
};
```

### JavaScript — default probe

```js
console.log('🧪 [App.js:10] debug'); // probemark:auto
```

### Python — cursor on `name` inside `def greet`

```py
# Before
def greet():
    name = 'Rose'

# After
def greet():
    name = 'Rose'
    print('🧪 [greet.py:4] greet → name:', name)  # probemark:auto
```

### Java — cursor on `count` inside `handleCount`

```java
// Before
public void handleCount() {
    int count = 10;
}

// After
public void handleCount() {
    int count = 10;
    System.out.println("🧪 [Counter.java:3] handleCount → count: " + count); // probemark:auto
}
```

### PHP — selected text `$user`

```php
// Before
$user = getUser();

// After
$user = getUser();
var_dump($user); // probemark:auto
```

### Go — selected text `user` inside `func Process`

```go
// Before
func Process() {
    user := getUser()
}

// After
func Process() {
    user := getUser()
    fmt.Println("🧪 [process.go:5] Process → user:", user) // probemark:auto
}
```

## Important caveats

- **Line numbers are snapshots** — the line number reflects the position at insertion time. It will not auto-update after edits.
- **Function detection is heuristic** — ProbeMark scans upward with lightweight regex patterns. It is not a parser. If no function is found, the prefix simply omits it.
- **Only generated probes are removed** — cleanup commands only remove lines containing `probemark:auto`.
- **Hand-written logs are preserved** — ordinary `console.log`, `print`, `var_dump`, `fmt.Println`, and business logging calls are not removed unless they contain the `probemark:auto` marker.
- **PHP variables** — if the selected text does not start with `$`, ProbeMark prepends `$`. If it already has `$`, it is kept as-is.
- **PHP context limitation** — variable probes use `var_dump($value)` in this version, so the context prefix is not included for PHP variable probes.
- **Go imports** — ProbeMark does not modify imports. If `fmt` is not imported, add `import "fmt"` manually.

## Customising the shortcut

1. Open the Keyboard Shortcuts editor:
   - macOS: `Cmd + K`, then `Cmd + S`
   - Windows/Linux: `Ctrl + K`, then `Ctrl + S`
2. Search for `ProbeMark`.
3. Change the keybinding to your preferred shortcut.

## Privacy

ProbeMark runs locally in VS Code.

- No network requests
- No telemetry
- No code upload
- No AI service dependency

## Development

Install dependencies:

```bash
npm install
```

Compile the extension:

```bash
npm run compile
```

Run automated tests:

```bash
npm run test:unit
npm run test:integration
npm run test:regression
```

Run the full pre-publish check:

```bash
npm run prepublish:check
```

Launch the extension locally:

1. Open this project in VS Code.
2. Press `F5`.
3. A new Extension Development Host window will open.
4. Open a supported source file and run `ProbeMark: Insert Debug Probe`.

## Release checklist

Before publishing a new version, verify:

- `npm run compile` passes
- `npm run test:unit` passes
- `npm run test:integration` passes
- `npm run test:regression` passes
- `npm run prepublish:check` passes
- Newly inserted probes use `probemark:auto`
- Cleanup commands remove only generated probes
- Hand-written logs remain untouched
- README examples match the actual generated output

## License

MIT