import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { LanguageSupport, StreamLanguage } from '@codemirror/language';

import { scilab } from './mode';

/**
 * Registers a "Scilab" CodeMirror language, so that scilab_kernel notebooks
 * (which report codemirror_mode: "scilab" once this extension is present --
 * see Calysto/scilab_kernel) get real Scilab highlighting instead of
 * borrowing Octave's mode (which gets "//" comments wrong).
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-scilab:plugin',
  description: 'Scilab syntax highlighting for the CodeMirror editor',
  autoStart: true,
  requires: [IEditorLanguageRegistry],
  activate: (app: JupyterFrontEnd, languages: IEditorLanguageRegistry) => {
    languages.addLanguage({
      name: 'Scilab',
      mime: 'text/x-scilab',
      extensions: ['sci', 'sce'],
      load: async () => new LanguageSupport(StreamLanguage.define(scilab))
    });
  }
};

export default plugin;
