# jupyterlab-scilab

A JupyterLab extension that registers a real "Scilab" CodeMirror language
(`text/x-scilab`), so Scilab notebooks get correct syntax highlighting in
the live editor.

## Install

```bash
pip install jupyterlab-scilab
```

or, together with the kernel itself:

```bash
pip install scilab-kernel[jupyterlab]
```

That's it -- it's a "prebuilt" JupyterLab extension, so no `jlpm`/Node.js
step is needed for end users. [scilab_kernel](https://github.com/Calysto/scilab_kernel)
picks it up automatically once installed: open a notebook with the Scilab
kernel and cells are highlighted. (Requires a scilab_kernel release that
includes [Calysto/scilab_kernel#58](https://github.com/Calysto/scilab_kernel/pull/58);
if you're on an older release, upgrade scilab_kernel first.)

## Why this exists

JupyterLab has no built-in Scilab CodeMirror mode. The closest built-in
one is Octave's (Scilab's syntax being close to Octave/Matlab), but
Octave's mode only recognizes `%` as a line comment -- Scilab uses `//` --
so comments aren't styled, and JupyterLab's "Toggle Comment" (Ctrl+/)
would insert invalid Scilab syntax. This extension replaces that stopgap
with a dedicated tokenizer instead (`src/mode.ts`, a CodeMirror 6
`StreamLanguage`, the same style as CodeMirror's own legacy Octave/Matlab
modes): correct `//`/`/* */` comments, correct transpose-vs-string
disambiguation (`x'`, `[1 2 3]'`, `(a+b)'`), and ~2200 keywords/builtins
sourced directly from a real Scilab session's own `getscilabkeywords()`
and `what()` -- not a hand-guessed list.

## Status

Published and wired up: `scilab_kernel` reports `codemirror_mode:
"scilab"` and this extension provides it. Verified end-to-end against a
live JupyterLab 4.6 instance, including previously-tricky cases (`//`
comments, transpose after closing brackets, primitives like
`real`/`imag`/`cvode`/`plot2d2` that Scilab's own `getscilabkeywords()`
doesn't enumerate).

Known gaps, if you'd like to help:

- The keyword/builtin lists in `src/mode.ts` are comprehensive but not
  exhaustive -- Scilab has a very large standard library, and new names
  turn up as people use it. See the comment at the top of `src/mode.ts`
  for how to regenerate them from a Scilab session.
- No automated syntax tests yet.

## Build (for development)

Requires Node.js (18+) in addition to the Python environment JupyterLab is
installed in. Not needed just to use the extension -- see Install above.

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
