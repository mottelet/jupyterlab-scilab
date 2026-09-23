# jupyterlab-scilab

A JupyterLab extension that registers a real "Scilab" CodeMirror language
(`text/x-scilab`), instead of `scilab_kernel` borrowing Octave's mode.

## Why this exists

`scilab_kernel` currently reports `codemirror_mode: "octave"` as a stopgap
([Calysto/scilab_kernel#58](https://github.com/Calysto/scilab_kernel/pull/58)),
since JupyterLab has no built-in Scilab mode. That gets most tokens
(keywords, strings, numbers, operators) highlighted, but Octave's mode only
recognizes `%` as a line comment -- Scilab uses `//` -- so comments aren't
styled and JupyterLab's "Toggle Comment" (Ctrl+/) inserts invalid Scilab
syntax.

This extension fixes that by registering a small dedicated tokenizer
(`src/mode.ts`, a CodeMirror 6 `StreamLanguage`, the same style as
CodeMirror's own legacy Octave/Matlab modes) under the mimetype
`text/x-scilab`. Once it's installed, `scilab_kernel` can go back to
reporting `codemirror_mode: "scilab"` and get this instead of Octave's.

## Status

This is a starting point, not a finished extension:

- The keyword/builtin lists in `src/mode.ts` are a reasonable first pass,
  not exhaustive -- Scilab has a very large standard library.
- No syntax tests yet.
- Not yet wired up to `scilab_kernel` (that repo needs `codemirror_mode`
  switched from `"octave"` to `"scilab"` once this is published).
- **Not built or tested against a real JupyterLab instance yet** -- the
  machine this was scaffolded on has no Node.js installed, only the
  Python/`jlpm` side of the JupyterLab toolchain. See "Build" below.

## Build

Requires Node.js (18+) in addition to the Python environment JupyterLab is
installed in.

```bash
jlpm install                    # installs the JS dependencies
jlpm build                      # compiles src/ and builds the labextension
pip install -e .                # editable install; hatch-jupyter-builder
                                 # links jupyterlab_scilab/labextension into
                                 # JupyterLab's extension search path
jupyter labextension list       # should now list jupyterlab-scilab
```

For iterative development, `jlpm watch` (in one terminal) + `jupyter lab
--watch` (in another) rebuilds on save.

## Layout

- `src/mode.ts` -- the actual Scilab tokenizer (comments, strings, numbers,
  keywords, operators).
- `src/index.ts` -- the JupyterLab plugin that registers `src/mode.ts` with
  `IEditorLanguageRegistry`.
- `package.json` / `tsconfig.json` -- the JS/TS side of the build.
- `pyproject.toml` -- packages the built JS as a pip-installable "prebuilt"
  JupyterLab extension (`hatch-jupyter-builder`), so `pip install
  jupyterlab-scilab` is enough for end users -- no separate `jlpm`/Node.js
  step for them.
