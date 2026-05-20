// Ambient type for CSS Modules. zfb resolves `*.module.css` default imports
// to a build-time `{ originalName: scopedName }` object; this declaration
// just makes the TypeScript compiler accept the import.
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
