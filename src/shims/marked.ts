// Compat shim for glide-data-grid, which calls marked(src) expecting a synchronous string.
// marked v18 still supports synchronous parsing but the default overload returns
// string | Promise<string>. Passing { async: false } narrows the return type to string.
import { marked as _marked } from "marked";

export const marked = (src: string): string => _marked(src, { async: false });
