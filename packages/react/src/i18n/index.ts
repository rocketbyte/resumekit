export {
  BASE_LOCALE,
  TEMPLATE_CATALOGS,
  matchLocale,
  resolveCatalog,
  type DocumentMessages,
  type EditorMessages,
  type NounForms,
  type PartialCatalog,
  type PluralForms,
  type TemplateCatalog,
} from './catalog.js';
export { format, list, plural, type MessageParams } from './format.js';
export {
  TemplateLocaleProvider,
  useDocumentText,
  useEditorText,
  type DocumentText,
  type EditorText,
  type TemplateLocaleProviderProps,
} from './locale-context.js';
