// A CodeMirror 6 StreamLanguage tokenizer for Scilab.
//
// This deliberately follows the same style as CodeMirror's own legacy
// Octave mode (github.com/codemirror/legacy-modes/blob/main/mode/octave.js)
// -- a hand-rolled state machine rather than a Lezer grammar -- since that
// is enough to fix the two things Octave's mode gets wrong for Scilab:
// "//" line comments (Scilab, not "%") and the Scilab keyword/builtin set.
import type { StreamParser, StringStream } from '@codemirror/language';

// keywordWords/constantWords/builtinWords below were generated from a real
// Scilab session. getscilabkeywords() returns 5 lists: [1] is every
// compiled primitive (gateway) function, e.g. sin/real/plot2d2/cvode --
// confirmed against what()'s own [primitives, commandes] output, which
// returns the same set; [2] is the true reserved-word set (keywordWords);
// [3] is predefined variables/library names (constantWords); [4] is every
// loaded *macro* (interpreted .sci-file function); [5] is Scicos-specific
// plumbing and isn't included here. Both [1] and [4] contain a large
// number of "%type_op_othertype" entries (e.g. "%0_n_0", "%zpk_q_r") --
// internal operator/overload-dispatch macros that are never typed by
// users -- filtered out below. builtinWords is [1] + [4] (each filtered)
// plus "help", which isn't defined in a headless Scilab session (no GUI
// help browser loaded) so it's missing from both lists even though it's a
// real, commonly-typed command.
//
// To refresh from a newer Scilab release, in the Scilab console:
//   k = getscilabkeywords();
//   for i = 1:size(k(2), "*"); printf("%s\n", k(2)(i)); end   // keywords
//   for i = 1:size(k(3), "*"); printf("%s\n", k(3)(i)); end   // constants
//   for i = 1:size(k(1), "*"); printf("%s\n", k(1)(i)); end   // primitives
//   for i = 1:size(k(4), "*"); printf("%s\n", k(4)(i)); end   // macros
// then drop every "%..." entry from the primitives/macros dumps and merge
// what's left into builtinWords.

const keywordWords = [
  "abort", "apropos", "arguments", "break", "case", "catch", "classdef", "clc",
  "clear", "continue", "do", "doc", "else", "elseif", "end", "endfunction",
  "enumeration", "exit", "for", "function", "if", "methods", "pause", "properties",
  "pwd", "quit", "resume", "return", "select", "then", "try", "what",
  "while", "who"
];

const constantWords = [
  "%chars", "%e", "%eps", "%fftw", "%gui", "%i", "%inf", "%io",
  "%nan", "%pi", "%s", "%tk", "%z", "PWD", "SCI", "SCIHOME",
  "TMPDIR", "annealinglib", "assertlib", "astlib", "atomsguilib", "atomslib", "cacsdlib", "clear",
  "colormapslib", "compatibility_functilib", "consolelib", "corelib", "data_structureslib", "datatipslib", "demo_toolslib", "development_toolslib",
  "differential_equationlib", "dynamic_linklib", "elementary_functionslib", "enull", "evoid", "external_objectslib", "fileiolib", "functionslib",
  "geneticlib", "graphicslib", "guilib", "helptoolslib", "home", "integerlib", "interpolationlib", "iolib",
  "jnull", "jvmlib", "jvoid", "linear_algebralib", "m2scilib", "matiolib", "modules_managerlib", "neldermeadlib",
  "optimbaselib", "optimizationlib", "optimsimplexlib", "output_streamlib", "overloadinglib", "parameterslib", "percentchars", "polynomialslib",
  "preferenceslib", "randliblib", "scicos_autolib", "scicos_scicoslib", "scicos_utilslib", "scinoteslib", "signal_processinglib", "soundlib",
  "sparselib", "special_functionslib", "spreadsheetlib", "statisticslib", "stringlib", "timelib", "ui_datalib", "uitreelib",
  "umfpacklib", "xcoslib", "xmllib"
];

const builtinWords = [
  "Accent", "BrBG", "BuGn", "BuPu", "CC4", "CFORTR", "CFORTR2", "Calendar",
  "ClipBoard", "Compute_cic", "Dark2", "FORTR", "G_make", "GnBu", "Link_modelica_C", "MODCOM",
  "Matplot", "Matplot1", "NDcost", "NaT", "OS_Version", "OrRd", "PRGn", "Paired",
  "Pastel1", "Pastel2", "PiYG", "PlaySound", "PlotSparse", "PuBu", "PuBuGn", "PuOr",
  "PuRd", "RdBu", "RdGy", "RdPu", "RdYlBu", "RdYlGn", "ReadHBSparse", "ResetFigureDDM",
  "SUN_Clink", "Set1", "Set2", "Set3", "Sfgrayplot", "Sgrayplot", "TitleLabel", "YlGn",
  "YlGnBu", "YlOrBr", "YlOrRd", "_", "abcd", "abinv", "abort", "about",
  "abs", "accept_func_default", "accept_func_vfsa", "acos", "acosd", "acosh", "acoshm", "acosm",
  "acot", "acotd", "acoth", "acsc", "acscd", "acsch", "addModulePreferences", "add_demo",
  "add_help_chapter", "add_module_help_chapter", "add_param", "addcolor", "addhistory", "addinter", "addlocalizationdomain", "addmenu",
  "addvars", "adj2sp", "adjust", "adjust_in2out2", "aff2ab", "airy", "amell", "ana_style",
  "analpf", "analyze", "analyzerOptions", "and", "angle", "aplat", "apropos", "argn",
  "arhnk", "arkode", "arl2", "arl2_ius", "arma2p", "arma2ss", "armac", "armax",
  "armax1", "arobasestring2strings", "arsimul", "ascii", "ascii2string", "asciimat", "asec", "asecd",
  "asech", "asin", "asind", "asinh", "asinhm", "asinm", "assert_checkalmostequal", "assert_checkequal",
  "assert_checkerror", "assert_checkfalse", "assert_checkfilesequal", "assert_checktrue", "assert_comparecomplex", "assert_computedigits", "assert_cond2reltol", "assert_cond2reqdigits",
  "assert_generror", "atan", "atand", "atanh", "atanhm", "atanm", "atomsAutoload", "atomsAutoloadAdd",
  "atomsAutoloadDel", "atomsAutoloadList", "atomsCategoryList", "atomsCheckModule", "atomsDepTreeShow", "atomsGetConfig", "atomsGetInstalled", "atomsGetInstalledPath",
  "atomsGetLoaded", "atomsGetLoadedPath", "atomsGui", "atomsInstall", "atomsIsInstalled", "atomsIsLoaded", "atomsList", "atomsLoad",
  "atomsQuit", "atomsRemove", "atomsRepositoryAdd", "atomsRepositoryDel", "atomsRepositoryList", "atomsResize", "atomsRestoreConfig", "atomsSaveConfig",
  "atomsSearch", "atomsSetConfig", "atomsShow", "atomsSystemInit", "atomsSystemUpdate", "atomsTest", "atomsUpdate", "atomsVersion",
  "augment", "auread", "autumn", "auwrite", "bad_connection", "balanc", "balreal", "banner",
  "bar", "bar3d", "barh", "barhomogenize", "base2dec", "basename", "bdiag", "beep",
  "bench_run", "bernstein", "besselh", "besseli", "besselj", "besselk", "bessely", "beta",
  "bezier", "bezout", "bfinit", "bilin", "bilt", "bin2dec", "binomial", "bit_op",
  "bitand", "bitcmp", "bitget", "bitor", "bitset", "bitstring", "bitxor", "black",
  "blanks", "blkfc1i", "blkslv", "blkslvi", "bloc2ss", "block_parameter_error", "blockdiag", "blues",
  "bode", "bode_asymp", "bone", "bool2s", "browsehistory", "browsevar", "browsevar_seeSpecial", "bsplin3val",
  "bstap", "buildDoc", "build_block", "build_modelica_block", "buildnewblock", "buildouttb", "buttmag", "bvode",
  "bvodeS", "c_link", "c_pass1", "c_pass2", "c_pass3", "cainv", "caldays", "calendar",
  "calendarDuration", "calerf", "calfrq", "call", "callblk", "calmonths", "calyears", "canon",
  "cart2pol", "casc", "cat", "cat_code", "cbAtomsGui", "cb_m2sci_gui", "ccontrg", "cd",
  "cdfbet", "cdfbin", "cdfchi", "cdfchn", "cdff", "cdffnc", "cdfgam", "cdfnbn",
  "cdfnor", "cdfpoi", "cdft", "cdftnc", "ceil", "cell", "cell2mat", "cell2table",
  "cellstr", "center", "cepstrum", "cfspec", "champ", "char", "chdir", "cheb1mag",
  "cheb2mag", "check2dFun", "checkNamedArguments", "checkXYPair", "check_classpath", "check_gateways", "check_io", "check_librarypath",
  "check_modules_xml", "check_versions", "chepol", "chfact", "chol", "chsolve", "circshift", "classmarkov",
  "clc", "clean", "clean_help", "clear", "clearfun", "clearglobal", "clf", "clipboard",
  "clock", "close", "closeEditor", "closeXcos", "cls2dls", "cmndred", "cmoment", "coding_ga_binary",
  "coding_ga_identity", "coeff", "coff", "coffg", "colcomp", "colcompr", "colinout", "color",
  "colorbar", "colordef", "colormap", "colregul", "combinations", "comet", "comet3d", "companion",
  "compile_init_modelica", "compile_modelica", "completion", "complex", "compress", "compute_initial_temp", "cond", "cond2sp",
  "condestsp", "conj", "conjgrad", "cont_frm", "cont_mat", "context_evstr", "contour", "contour2d",
  "contour2di", "contour2dm", "contourf", "contr", "contrss", "conv", "conv2", "convert_to_float",
  "convertindex", "convol", "convol2d", "convstr", "cool", "coolwarm", "copfac", "copper",
  "copy", "copyfile", "corr", "correl", "cos", "cos2cosf", "cosd", "coserror",
  "cosh", "coshm", "cosm", "cotd", "cotg", "coth", "cothm", "countblocks",
  "cov", "covMerge", "covStart", "covStop", "covWrite", "covar", "createBorder", "createBorderFont",
  "createConstraints", "createLayoutOptions", "createWindow", "createXConfiguration", "create_modelica", "createdir", "createfun", "createstruct",
  "cross", "crossover_ga_binary", "crossover_ga_default", "csc", "cscd", "csch", "csgn", "cshep2d",
  "csim", "cspect", "csvDefault", "csvIsnum", "csvRead", "csvStringToDouble", "csvTextScan", "csvWrite",
  "ctr_gram", "ctree2", "ctree3", "ctree4", "cumprod", "cumsum", "curblock", "cutaxes",
  "cvode", "cylinder", "czt", "dae", "daeoptions", "damp", "data2sig", "datafit",
  "datatipCreate", "datatipGetEntities", "datatipManagerMode", "datatipMove", "datatipRemove", "datatipRemoveAll", "datatipSetDisplay", "datatipSetInterp",
  "datatipSetOrientation", "datatipSetStyle", "date", "datenum", "datetime", "datevec", "dawson", "day",
  "days", "dbphi", "dbscan", "dcf", "dct", "ddp", "debug", "dec2base",
  "dec2bin", "dec2hex", "dec2oct", "decompress", "default_color", "default_options", "deff", "definedfields",
  "degree", "del_help_chapter", "del_module_help_chapter", "delete", "delete_unconnected", "deletefile", "delip", "delmenu",
  "demo_begin", "demo_choose", "demo_compiler", "demo_end", "demo_file_choice", "demo_function_choice", "demo_gui", "demo_gui_update",
  "demo_run", "demo_viewCode", "derivat", "des2ss", "des2tf", "det", "detectDelimiter", "detectFormatDatetime",
  "detectHeader", "detectImportOptions", "determ", "detr", "detrend", "devtools_run_builder", "dhinf", "dhnorm",
  "diag", "dialog", "diary", "diff", "diffobjs", "diffxy", "dig_bound_compound", "diophant",
  "dir", "disp", "dispfiles", "displayhistory", "disposefftwlibrary", "dlgamma", "dllinfo", "do_compile",
  "do_compile_superblock42", "do_delete1", "do_eval", "do_purge", "do_terminate", "do_update", "do_version", "doc",
  "double", "dragrect", "drawaxis", "drawlater", "drawnow", "driver", "dscr", "dsearch",
  "dsimul", "dst", "dt_ility", "dtsi", "duplicate", "duration", "edit", "edit_curv",
  "edit_error", "editor", "editvar", "eigenmarkov", "eigs", "ell1mag", "ellipj", "emptystr",
  "end_scicosim", "enlarge_shape", "enumeration", "eomday", "epred", "eqfir", "eqiir", "equil",
  "equil1", "ereduc", "erf", "erfc", "erfcx", "erfi", "erfinv", "errbar",
  "errclear", "error", "estimate_bandwidth", "etime", "eval3dp", "eval_cshep2d", "evans", "evstr",
  "example_run", "exec", "execstr", "exists", "exit", "exp", "expm", "exportUI",
  "expression2code", "extract_implicit", "eye", "factor", "factorial", "factors", "faurre", "fchamp",
  "fec", "feval", "ffilt", "fft", "fft2", "fftshift", "fftw", "fftw_flags",
  "fftw_forget_wisdom", "fftwlibraryisloaded", "fgrayplot", "fieldnames", "figure", "file", "filebrowser", "fileext",
  "fileinfo", "fileparts", "filesep", "filt_sinc", "filter", "find", "findABCD", "findAC",
  "findBD", "findBDK", "findCommonValues", "findR", "find_freq", "find_links", "find_scicos_version", "findfiles",
  "findinlist", "findinlistcmd", "findm", "findmsifortcompiler", "findmsvccompiler", "findobj", "findx0BD", "fire_closing_finished",
  "firstnonsingleton", "fix", "fixedpointgcd", "flag", "flipdim", "floor", "flts", "fminsearch",
  "format", "formatBlackTip", "formatBodeMagTip", "formatBodePhaseTip", "formatEvansTip", "formatGainplotTip", "formatHallModuleTip", "formatHallPhaseTip",
  "formatNicholsGainTip", "formatNicholsPhaseTip", "formatNyquistTip", "formatPhaseplotTip", "formatSgridDampingTip", "formatSgridFreqTip", "formatZgridDampingTip", "formatZgridFreqTip",
  "format_txt", "fourplan", "fplot3d", "fplot3d1", "fprintfMat", "frank", "frep2tf", "freq",
  "freson", "frexp", "frfit", "frmag", "fromJSON", "fromc", "fromjava", "fscanfMat",
  "fseek_origin", "fsfirlin", "fsolve", "fspec", "fspecg", "fstabst", "fstair", "ftest",
  "ftuneq", "full", "fullfile", "fullpath", "fullrf", "fullrfk", "funclist", "funcprot",
  "funptr", "g_margin", "gainplot", "gallery", "gamitg", "gamma", "gammaln", "gca",
  "gcare", "gcd", "gce", "gcf", "gda", "gdf", "ged", "ged_insert",
  "gen_modelica", "gencompilationflags_unix", "generateBlockImage", "generateBlockImages", "generic_i_ce", "generic_i_h", "generic_i_hm", "generic_i_s",
  "generic_s_g_s", "generic_s_h_s", "genfac3d", "genfunc", "genfunc1", "genfunc2", "genlib", "genmac",
  "genmarkov", "geom3d", "geomean", "get", "get2index", "getBrowserCookies", "getColorIndex", "getDiagramVersion",
  "getHelpPage", "getLineSpec", "getModelicaPath", "getPlotPropertyName", "getSurfPropertyName", "get_absolute_file_path", "get_connected", "get_dynamic_lib_dir",
  "get_errorcmd", "get_fftw_wisdom", "get_file_path", "get_function_path", "get_model_name", "get_param", "get_scicos_version", "get_subobj_path",
  "get_tree_elt", "getblocklabel", "getcallbackobject", "getcolor", "getd", "getdate", "getdebuginfo", "getdefaultlanguage",
  "getdeprecated", "getdrives", "getdynlibext", "getenv", "getfield", "gethistory", "gethistoryfile", "getinstalledlookandfeels",
  "getio", "getlanguage", "getlongpathname", "getlookandfeel", "getmd5", "getmemory", "getmodelicacpath", "getmodules",
  "getos", "getpid", "getrelativefilename", "getscicosvars", "getscilabkeywords", "getscilabmode", "getshell", "getshortpathname",
  "gettext", "getvalue", "getversion", "gfare", "gfrancis", "ghdl2tree", "ghdl_fields", "givens",
  "glever", "global", "global_case", "glue", "gmres", "gradient", "graduate", "grand",
  "gray", "grayplot", "graypolarplot", "greens", "grep", "greys", "group", "groupcounts",
  "groupsummary", "gsort", "gtild", "h2norm", "h5attr", "h5close", "h5cp", "h5dataset",
  "h5dump", "h5exists", "h5flush", "h5get", "h5group", "h5isArray", "h5isAttr", "h5isCompound",
  "h5isFile", "h5isGroup", "h5isList", "h5isRef", "h5isSet", "h5isSpace", "h5isType", "h5isVlen",
  "h5label", "h5ln", "h5ls", "h5mount", "h5mv", "h5open", "h5read", "h5readattr",
  "h5rm", "h5umount", "h5write", "h5writeattr", "h_cl", "h_inf", "h_inf_st", "h_norm",
  "hadamard", "hallchart", "halt", "hank", "hankel", "hankelsv", "harmean", "hash",
  "haveacompiler", "hdf5_file_version", "hdf5_is_file", "hdf5_listvar", "hdf5_listvar_v2", "hdf5_listvar_v3", "hdf5_load", "hdf5_load_v1",
  "hdf5_load_v2", "hdf5_load_v3", "hdf5_load_v4", "hdf5_save", "head", "head_comments", "help", "help_from_sci",
  "help_skeleton", "helpbrowser", "helpbrowser_menus_cb", "helpbrowser_update", "hermit", "hess", "hex2dec", "hilb",
  "hilbert", "hilbm", "hilite_path", "hinf", "histc", "historymanager", "historysize", "histplot",
  "hms", "horner", "host", "hot", "hours", "householder", "hrmt", "hsv",
  "hsv2rgb", "htmlDump", "htmlRead", "htmlReadStr", "htmlWrite", "htrianr", "http_delete", "http_get",
  "http_patch", "http_post", "http_put", "http_upload", "iconvert", "ida", "idct", "idst",
  "ieee", "ifft", "ifftshift", "iir", "iirgroup", "iirlp", "iirmod", "ilib_build",
  "ilib_build_jar", "ilib_compile", "ilib_for_link", "ilib_gen_Make", "ilib_gen_Make_unix", "ilib_gen_cleaner", "ilib_gen_gateway", "ilib_gen_loader",
  "ilib_include_flag", "ilib_language", "ilib_mex_build", "ilib_verbose", "im_inv", "imag", "importScicosPal", "importXcosDiagram",
  "imrep2ss", "imult", "ind2sub", "inistate", "init_agenda", "init_ga_default", "init_param", "initial_scicos_tables",
  "inpnvi", "input", "insert", "instruction2code", "int", "int16", "int2d", "int32",
  "int3d", "int64", "int8", "intc", "intdec", "integrate", "interp", "interp1",
  "interp2d", "interp3d", "interpln", "intersect", "intg", "intl", "intppty", "intsplin",
  "inttrap", "inttype", "inv", "inv_coeff", "invhilb", "invoke_lu", "invr", "invrs",
  "invsyslin", "iqr", "isDebug", "isDocked", "isLeapYear", "isRelease", "is_absolute_path", "is_handle_valid",
  "is_modelica_block", "is_param", "isa", "isalphanum", "isascii", "isatty", "iscalendarDuration", "iscell",
  "iscellstr", "iscolor", "iscolumn", "isdatetime", "isdef", "isdigit", "isdir", "isduration",
  "isempty", "isequal", "isfield", "isfile", "isglobal", "isinf", "isletter", "ismatrix",
  "isnan", "isnat", "isnum", "isoview", "isreal", "isregular", "isrow", "isscalar",
  "issparse", "issquare", "isstruct", "istable", "istimeseries", "isvector", "iswaitingforinput", "jallowClassReloading",
  "jarray", "jautoTranspose", "jautoUnwrap", "javaclasspath", "javalibrarypath", "jcast", "jcompile", "jcreatejar",
  "jdeff", "jdisableTrace", "jenableTrace", "jet", "jexists", "jgetclassname", "jgetfield", "jgetfields",
  "jgetinfo", "jgetmethods", "jimport", "jinvoke", "jinvoke_db", "jnewInstance", "join", "jre_path",
  "jremove", "jsetfield", "junwrap", "junwraprem", "justify", "jwrap", "jwrapinfloat", "kalm",
  "karmarkar", "kernel", "kinsol", "kmeans", "kpure", "krac2", "kron", "kroneck",
  "lasterror", "lattn", "lattp", "launchtest", "lcf", "lcm", "lcmdiag", "ldiv",
  "leastsq", "legend", "legendre", "legends", "length", "leqe", "leqr", "lev",
  "levin", "lft", "lib", "librarieslist", "libraryinfo", "light", "lin", "lin2mu",
  "lincos", "lindquist", "linear_interpn", "lines", "linf", "linfn", "link", "link_olibs",
  "linmeq", "linsolve", "linspace", "list", "list2tree", "list2vec", "list_param", "listfiles",
  "listvarinfile", "lmisolver", "lmitool", "lnkptrcomp", "load", "loadGui", "loadInlineHelp", "loadScicos",
  "loadToolboxInlineHelp", "loadXcos", "loadXcosLibs", "loadfftwlibrary", "loadhistory", "loadmatfile", "loadpallibs", "loadwave",
  "locate", "log", "log10", "log1p", "log2", "loglog", "logm", "logspace",
  "lqe", "lqg", "lqg2stan", "lqg_ltr", "lqi", "lqr", "ls", "lsq",
  "lsq_splin", "lsqrsolve", "lsslist", "lstcat", "ltitr", "lu", "ludel", "lufact",
  "luget", "lusolve", "lyap", "m2sci_gui", "macglov", "macr2tree", "macrovar", "mad",
  "magic", "main_menubar_cb", "makecell", "manedit", "mapsound", "mark_prt", "markp2ss", "matfile2sci",
  "matfile_close", "matfile_listvar", "matfile_open", "matfile_varreadnext", "matfile_varwrite", "matrix", "matrix2table", "matrix2timeseries",
  "max", "mclearerr", "mclose", "mdelete", "mean", "meanf", "meanshift", "median",
  "members", "menubar", "meof", "merror", "mese", "mesh", "mesh2d", "mesh2di",
  "meshgrid", "message", "messagebox", "methods", "mfile2sci", "mfprintf", "mfrequ_clk", "mfscanf",
  "mget", "mgeti", "mgetl", "mgetstr", "milliseconds", "min", "minreal", "minss",
  "minutes", "mkdir", "mlist", "mode", "model2blk", "modelica", "modelicac", "modipar",
  "modulo", "moment", "month", "mopen", "move", "movefile", "mprintf", "mput",
  "mputl", "mputstr", "mrfit", "mscanf", "mseek", "msprintf", "msscanf", "mstr2sci",
  "mtell", "mtlb", "mtlb_0", "mtlb_a", "mtlb_all", "mtlb_any", "mtlb_axes", "mtlb_axis",
  "mtlb_beta", "mtlb_box", "mtlb_choices", "mtlb_close", "mtlb_colordef", "mtlb_cond", "mtlb_cov", "mtlb_cumprod",
  "mtlb_cumsum", "mtlb_dec2hex", "mtlb_delete", "mtlb_diag", "mtlb_diff", "mtlb_dir", "mtlb_double", "mtlb_e",
  "mtlb_echo", "mtlb_error", "mtlb_eval", "mtlb_exist", "mtlb_eye", "mtlb_false", "mtlb_fft", "mtlb_fftshift",
  "mtlb_filter", "mtlb_find", "mtlb_findstr", "mtlb_fliplr", "mtlb_fopen", "mtlb_format", "mtlb_fprintf", "mtlb_fread",
  "mtlb_fscanf", "mtlb_full", "mtlb_fwrite", "mtlb_get", "mtlb_grid", "mtlb_hold", "mtlb_i", "mtlb_ifft",
  "mtlb_image", "mtlb_imp", "mtlb_int16", "mtlb_int32", "mtlb_int64", "mtlb_int8", "mtlb_is", "mtlb_isa",
  "mtlb_isfield", "mtlb_isletter", "mtlb_isspace", "mtlb_l", "mtlb_legendre", "mtlb_linspace", "mtlb_logic", "mtlb_logical",
  "mtlb_loglog", "mtlb_lower", "mtlb_max", "mtlb_mean", "mtlb_median", "mtlb_mesh", "mtlb_meshdom", "mtlb_min",
  "mtlb_more", "mtlb_num2str", "mtlb_ones", "mtlb_pcolor", "mtlb_plot", "mtlb_prod", "mtlb_qr", "mtlb_qz",
  "mtlb_rand", "mtlb_randn", "mtlb_realmax", "mtlb_realmin", "mtlb_s", "mtlb_semilogx", "mtlb_semilogy", "mtlb_setstr",
  "mtlb_size", "mtlb_sort", "mtlb_sortrows", "mtlb_sprintf", "mtlb_sscanf", "mtlb_std", "mtlb_strcmp", "mtlb_strcmpi",
  "mtlb_strfind", "mtlb_strrep", "mtlb_subplot", "mtlb_sum", "mtlb_t", "mtlb_toeplitz", "mtlb_tril", "mtlb_triu",
  "mtlb_true", "mtlb_type", "mtlb_uint16", "mtlb_uint32", "mtlb_uint64", "mtlb_uint8", "mtlb_upper", "mtlb_var",
  "mtlb_zeros", "mu2lin", "mucomp", "mutation_ga_binary", "mutation_ga_default", "mvcorrel", "name2rgb", "nancumsum",
  "nand2mean", "nanmean", "nanmeanf", "nanmedian", "nanreglin", "nanstdev", "nansum", "narsimul",
  "nchoosek", "ndgrid", "ndims", "nearfloat", "nearly_multiples", "nehari", "neigh_func_csa", "neigh_func_default",
  "neigh_func_fsa", "neigh_func_vfsa", "neldermead_cget", "neldermead_configure", "neldermead_costf", "neldermead_defaultoutput", "neldermead_destroy", "neldermead_function",
  "neldermead_get", "neldermead_log", "neldermead_new", "neldermead_restart", "neldermead_search", "neldermead_updatesimp", "newaxes", "newest",
  "newfun", "nextpow2", "nf3d", "nicholschart", "nlev", "nmplot_cget", "nmplot_configure", "nmplot_contour",
  "nmplot_destroy", "nmplot_function", "nmplot_get", "nmplot_historyplot", "nmplot_log", "nmplot_new", "nmplot_outputcmd", "nmplot_restart",
  "nmplot_search", "nmplot_simplexhistory", "nnz", "nonreg_test_run", "norm", "notify", "now", "nthroot",
  "null", "num2cell", "number_properties", "numderivative", "nyquist", "nyquistfrequencybounds", "obs_gram", "obscont",
  "observer", "obsv_mat", "obsvss", "ocean", "oct2dec", "ode", "odedc", "odeoptions",
  "oldEmptyBehaviour", "ones", "openDevtools", "openged", "optim", "optim_ga", "optim_moga", "optim_nsga",
  "optim_nsga2", "optim_sa", "optimbase_cget", "optimbase_checkbounds", "optimbase_checkcostfun", "optimbase_checkx0", "optimbase_configure", "optimbase_destroy",
  "optimbase_function", "optimbase_get", "optimbase_hasbounds", "optimbase_hasconstraints", "optimbase_hasnlcons", "optimbase_histget", "optimbase_histset", "optimbase_incriter",
  "optimbase_isfeasible", "optimbase_isinbounds", "optimbase_isinnonlincons", "optimbase_log", "optimbase_logshutdown", "optimbase_logstartup", "optimbase_new", "optimbase_outputcmd",
  "optimbase_outstruct", "optimbase_proj2bnds", "optimbase_set", "optimbase_stoplog", "optimbase_terminate", "optimget", "optimplotfunccount", "optimplotfval",
  "optimplotx", "optimset", "optimsimplex_center", "optimsimplex_check", "optimsimplex_compsomefv", "optimsimplex_computefv", "optimsimplex_deltafv", "optimsimplex_deltafvmax",
  "optimsimplex_destroy", "optimsimplex_dirmat", "optimsimplex_fvmean", "optimsimplex_fvstdev", "optimsimplex_fvvariance", "optimsimplex_getall", "optimsimplex_getallfv", "optimsimplex_getallx",
  "optimsimplex_getfv", "optimsimplex_getn", "optimsimplex_getnbve", "optimsimplex_getve", "optimsimplex_getx", "optimsimplex_gradientfv", "optimsimplex_log", "optimsimplex_new",
  "optimsimplex_reflect", "optimsimplex_setall", "optimsimplex_setallfv", "optimsimplex_setallx", "optimsimplex_setfv", "optimsimplex_setn", "optimsimplex_setnbve", "optimsimplex_setve",
  "optimsimplex_setx", "optimsimplex_shrink", "optimsimplex_size", "optimsimplex_sort", "optimsimplex_xbar", "or", "oranges", "ordmmd",
  "orth", "orthProj", "output_ga_default", "output_moga_default", "output_nsga2_default", "output_nsga_default", "p_margin", "pack",
  "param3d", "param3d1", "paramfplot2d", "pareto_filter", "parrot", "parser_idempotence", "part", "parula",
  "pascal", "pathconvert", "pathsep", "pause", "pbig", "pca", "pdiv", "peaks",
  "pen2ea", "pencan", "pencost", "penlaur", "percentchars", "perctl", "perms", "permute",
  "pertrans", "pfactors", "pfss", "phase_simulation", "phasemag", "phaseplot", "phc", "pie",
  "pink", "pinv", "pivot", "playsnd", "plot", "plot2d", "plot2d2", "plot2d3",
  "plot2d4", "plot3d", "plot3d1", "plot3d2", "plot3d3", "plotbrowser", "plotimplicit", "plzr",
  "pmodulo", "pointer_xproperty", "pol2cart", "pol2des", "pol2str", "polar", "polarplot", "polarplot_datatip_display",
  "polfact", "poly", "polyDisplay", "polyfit", "polyint", "polyval", "ppol", "pppdiv",
  "prbs_a", "predef", "preferences", "prettyprint", "primes", "print", "printf", "printfigure",
  "printsetupbox", "prism", "prod", "profileDisable", "profileEnable", "profileGetInfo", "progressionbar", "proj",
  "projaff", "projsl", "projspec", "prompt", "properties", "psmall", "pspect", "purples",
  "pwd", "qld", "qmr", "qp_solve", "qpsolve", "qr", "quart", "quaskro",
  "quit", "rainbow", "raise_window", "rand", "randpencil", "range", "rank", "rankqr",
  "rat", "rcond", "read", "read_csv", "reading_incidence", "readmps", "readtable", "readtimeseries",
  "readxls", "real", "realtime", "realtimeinit", "recons", "recur_scicos_block_link", "recursionlimit", "reds",
  "reduceToCommonDenominator", "regexp", "reglin", "remez", "remezb", "removeModulePreferences", "remove_param", "removedir",
  "removelinehistory", "removevars", "repfreq", "replace_Ix_by_Fx", "replot", "repmat", "res_with_prec", "resethistory",
  "residu", "resize_demo_gui", "resize_matrix", "retime", "returntoscilab", "rgb2name", "rhs2code", "ricc",
  "riccati", "rlist", "rlocus", "rmdir", "rmfield", "roots", "rosser", "rotate",
  "rotate_axes", "round", "routh_t", "rowcomp", "rowcompr", "rowfun", "rowinout", "rowregul",
  "rowshuff", "rpem", "rref", "rtitr", "rubberbox", "sample", "sample_clk", "samplef",
  "samwr", "save", "saveGui", "saveconsecutivecommands", "savehistory", "savematfile", "savewave", "sca",
  "scaling", "scanf", "scatter", "scatter3d", "scf", "schur", "sci2exp", "sci_tree2",
  "sci_tree3", "sci_tree4", "sciargs", "scicosDiagramToScilab", "scicos_block", "scicos_block_link", "scicos_cpr", "scicos_debug",
  "scicos_debug_count", "scicos_diagram", "scicos_flat", "scicos_getvalue", "scicos_graphics", "scicos_include_paths", "scicos_link", "scicos_load",
  "scicos_log", "scicos_model", "scicos_new", "scicos_params", "scicos_save", "scicos_setfield", "scicos_sim", "scicos_simulate",
  "scicos_state", "scicos_time", "scicos_txtedit", "scicosim", "scilab", "scimihm", "scinotes", "scitest",
  "script2var", "scs_full_path", "scs_show", "scstxtedit", "sctree", "sda", "sdf", "sdiff",
  "sec", "secd", "sech", "seconds", "secto3d", "selection_ga_elitist", "selection_ga_random", "semidef",
  "semilogx", "semilogy", "sensi", "set", "setDefaultColor", "setPlotProperty", "setSurfProperty", "set_blockerror",
  "set_fftw_wisdom", "set_io", "set_param", "set_xproperty", "setdefaultlanguage", "setdiff", "setenv", "seteventhandler",
  "setfield", "sethistoryfile", "setlanguage", "setlookandfeel", "setmenu", "setvalue", "sfact", "sfinit",
  "sgolay", "sgolaydiff", "sgolayfilt", "sgrid", "shiftcors", "show_margins", "show_pca", "show_vtable",
  "show_window", "sident", "sig2data", "sign", "signm", "simp", "simp_mode", "simplify_zp",
  "sin", "sinc", "sincd", "sind", "sinh", "sinhm", "sinm", "size",
  "skipArguments", "sleep", "slint", "sm2des", "sm2ss", "smga", "smooth", "sorder",
  "sortrows", "sp2adj", "spCompHessian", "spCompJacobian", "spaninter", "spanplus", "spantwo", "sparse",
  "spchol", "spcompack", "spec", "specfact", "spectral", "speye", "spget", "sphere",
  "splin", "splin2d", "splin3d", "split_lasterror", "spones", "sprand", "spring", "sprintf",
  "spset", "spyCol", "spzeros", "sqroot", "sqrt", "sqrtm", "squarewave", "squeeze",
  "srfaur", "srkf", "ss2des", "ss2ss", "ss2tf", "ss2zp", "sskf", "ssprint",
  "ssrand", "st_ility", "stabil", "stackedplot", "standard_define", "standard_draw", "standard_draw_ports", "standard_draw_ports_up",
  "standard_inputs", "standard_origin", "standard_outputs", "statgain", "stdev", "stdevf", "steadycos", "strange",
  "strcat", "strchr", "strcmp", "strcspn", "strindex", "string", "stringbox", "stripblanks",
  "strncpy", "strrchr", "strrev", "strsplit", "strspn", "strstr", "strsubst", "strtod",
  "strtok", "struct", "struct2table", "sub2ind", "subplot", "sum", "summer", "surf",
  "sva", "svd", "svplot", "swap_handles", "sylm", "sylv", "symfcti", "synchronize",
  "syredi", "sysconv", "sysfact", "syslin", "syssize", "system", "system_getproperty", "system_setproperty",
  "systmat", "table", "table2cell", "table2matrix", "table2struct", "table2timeseries", "tabul", "tail",
  "tan", "tand", "tanh", "tanhm", "tanm", "taucs_chdel", "taucs_chfact", "taucs_chget",
  "taucs_chinfo", "taucs_chsolve", "tbx_build_blocks", "tbx_build_cleaner", "tbx_build_gateway", "tbx_build_gateway_clean", "tbx_build_gateway_loader", "tbx_build_help",
  "tbx_build_help_loader", "tbx_build_loader", "tbx_build_localization", "tbx_build_macros", "tbx_build_pal_loader", "tbx_build_src", "tbx_build_src_clean", "tbx_builder",
  "tbx_builder_gateway", "tbx_builder_gateway_lang", "tbx_builder_help", "tbx_builder_help_lang", "tbx_builder_macros", "tbx_builder_src", "tbx_builder_src_lang", "tbx_generate_pofile",
  "tbx_get_name_from_path", "tbx_make", "tbx_package", "temp_law_csa", "temp_law_default", "temp_law_fsa", "temp_law_huang", "temp_law_vfsa",
  "tempname", "test_clean", "test_on_columns", "test_run", "test_run_level", "tf2des", "tf2ss", "tf2zp",
  "threadInspector", "thrownan", "tic", "time_i_timeseries", "time_id", "timer", "timeseries", "timeseries2table",
  "title", "titlepage", "tlist", "toJSON", "toc", "toeplitz", "tohome", "tokenpos",
  "tokens", "toolbar", "toolboxes", "toprint", "tr_zer", "trace", "trans", "translatepaths",
  "translator", "tree2code", "tree_show", "trfmod", "tril", "trimmean", "triu", "trzeros",
  "turbo", "twinkle", "type", "typename", "typeof", "uiConcatTree", "uiCreateNode", "uiCreateTree",
  "uiDeleteNode", "uiDisplayTree", "uiDumpTree", "uiEqualsTree", "uiFindNode", "uiGetChildrenNode", "uiGetNodePosition", "uiGetParentNode",
  "uiInsertNode", "ui_observer", "uicontextmenu", "uicontrol", "uigetcolor", "uigetdir", "uigetfile", "uigetfont",
  "uiimport", "uimenu", "uint16", "uint32", "uint64", "uint8", "uiputfile", "uitable",
  "uiwait", "ulink", "umf_ludel", "umf_lufact", "umf_luget", "umf_luinfo", "umf_lusolve", "umfpack",
  "unglue", "union", "unique", "unit_test_run", "unix", "unix_g", "unix_s", "unix_w",
  "unix_x", "unobs", "unpack", "unsetmenu", "unwrap", "unzoom", "update_scs_m", "update_version",
  "updatebrowsevar", "url_decode", "url_encode", "url_split", "usecanvas", "useeditor", "validvar", "value2modelica",
  "vander", "var2vec", "varfun", "variance", "variancef", "varn", "vec2list", "vec2var",
  "vectorfind", "ver", "waitbar", "warnBlockByUID", "warning", "warnobsolete", "wavread", "wavwrite",
  "wcenter", "weekday", "wfir", "wfir_gui", "what", "where", "whereami", "whereis",
  "white", "who", "who_user", "whos", "wiener", "wigner", "wilkinson", "window",
  "winsid", "winter", "with_javasci", "with_macros_source", "with_modelica_compiler", "with_module", "write", "write_csv",
  "writetable", "writetimeseries", "x_choices", "x_choose", "x_choose_modeless", "x_dialog", "x_matrix", "x_mdialog",
  "xarc", "xarcs", "xarrows", "xchange", "xchoicesi", "xclick", "xcorr", "xcos",
  "xcosAddToolsMenu", "xcosBlockEval", "xcosBlockInterface", "xcosCellCreated", "xcosCodeGeneration", "xcosConfigureModelica", "xcosConfigureXmlFile", "xcosDiagramToScilab",
  "xcosPal", "xcosPalAdd", "xcosPalAddBlock", "xcosPalCategoryAdd", "xcosPalDelete", "xcosPalDisable", "xcosPalEnable", "xcosPalExport",
  "xcosPalGenerateAllIcons", "xcosPalGenerateIcon", "xcosPalGet", "xcosPalLoad", "xcosPalMove", "xcosShowBlockWarning", "xcosSimulationStarted", "xcosUpdateBlock",
  "xcosValidateBlockSet", "xcosValidateCompareBlock", "xcos_compile", "xcos_debug_gui", "xcos_run", "xcos_simulate", "xcov", "xend",
  "xfarc", "xfarcs", "xfpoly", "xfpolys", "xfrect", "xgetmouse", "xgraduate", "xgrid",
  "xinit", "xlabel", "xlfont", "xload", "xls_open", "xls_read", "xml2modelica", "xmlAddNs",
  "xmlAppend", "xmlAsNumber", "xmlAsText", "xmlDTD", "xmlDelete", "xmlDocument", "xmlDump", "xmlElement",
  "xmlFormat", "xmlGetNsByHref", "xmlGetNsByPrefix", "xmlGetOpenDocs", "xmlGetValues", "xmlIsValidObject", "xmlName", "xmlNs",
  "xmlRead", "xmlReadStr", "xmlRelaxNG", "xmlRemove", "xmlSchema", "xmlSetAttributes", "xmlSetValues", "xmlValidate",
  "xmlWrite", "xmlXPath", "xmltoformat", "xmltohtml", "xmltoinline", "xmltojar", "xmltopdf", "xmltops",
  "xmltoweb", "xnumb", "xpoly", "xpolys", "xrect", "xrects", "xrpoly", "xs2bmp",
  "xs2emf", "xs2eps", "xs2gif", "xs2jpg", "xs2pdf", "xs2png", "xs2ppm", "xs2ps",
  "xs2svg", "xsave", "xsegs", "xsetech", "xstring", "xstringb", "xstringl", "xtitle",
  "year", "years", "ylabel", "ymd", "yulewalk", "zeropen", "zeros", "zgrid",
  "zlabel", "zoom_rect", "zp2ss", "zp2tf", "zpbutt", "zpch1", "zpch2", "zpell",
  "zpk", "zpk2ss", "zpk2tf"
];

const keywords = new Set(keywordWords);
const constants = new Set(constantWords);
const builtins = new Set(builtinWords);

const singleOperators = /^[+\-*/\\^~<>!&|@']/;
const doubleOperators =
  /^((==)|(~=)|(<>)|(<=)|(>=)|(&&)|(\|\|)|(\.[*/\\^'])|(:=))/;
const singleDelimiters = /^[()[\]{},;:=.]/;
// %-prefixed constants (e.g. %pi, %i) share the same shape as identifiers.
const identifiers = /^%?[_A-Za-z][_A-Za-z0-9]*/;

interface ScilabState {
  tokenize: (stream: StringStream, state: ScilabState) => string | null;
}

function tokenTranspose(stream: StringStream, state: ScilabState): string | null {
  // A bare "'" right after a value is the transpose operator, not the
  // start of a string -- same ambiguity (and same fix) as Octave's mode.
  state.tokenize = tokenBase;
  if (stream.eat("'")) {
    return 'operator';
  }
  return tokenBase(stream, state);
}

function tokenString(quote: string) {
  return (stream: StringStream, state: ScilabState): string | null => {
    let escaped = false;
    while (!stream.eol()) {
      const ch = stream.next();
      if (ch === quote && !escaped) {
        // Scilab (like Octave/Matlab) escapes an embedded quote by
        // doubling it, e.g. 'it''s'.
        if (stream.peek() === quote) {
          stream.next();
          continue;
        }
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && ch === '\\';
    }
    return 'string';
  };
}

function tokenBase(stream: StringStream, state: ScilabState): string | null {
  if (stream.eatSpace()) {
    return null;
  }

  const ch = stream.peek() as string;

  // "//" line comment, "/* */" block comment -- the actual point of this
  // file: Octave's mode only knows "%" and would mis-highlight every
  // Scilab comment.
  if (ch === '/') {
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match('/*')) {
      state.tokenize = tokenBlockComment;
      return state.tokenize(stream, state);
    }
  }

  if (ch === "'" || ch === '"') {
    stream.next();
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }

  if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(stream.string.charAt(stream.pos + 1)))) {
    stream.match(/^[0-9]*\.?[0-9]+([edED][+-]?[0-9]+)?/);
    state.tokenize = tokenTranspose;
    return 'number';
  }

  if (stream.match(identifiers)) {
    const word = stream.current();
    state.tokenize = tokenTranspose;
    if (keywords.has(word)) {
      return 'keyword';
    }
    if (constants.has(word)) {
      return 'atom';
    }
    if (builtins.has(word)) {
      return 'builtin';
    }
    return 'variableName';
  }

  if (stream.match(doubleOperators) || stream.match(singleOperators)) {
    return 'operator';
  }

  if (stream.match(singleDelimiters)) {
    // A closing bracket can end an expression too: [1 2 3]' and (a+b)'
    // are transposes, not the start of a string.
    if (ch === ')' || ch === ']' || ch === '}') {
      state.tokenize = tokenTranspose;
    }
    return null;
  }

  stream.next();
  return null;
}

function tokenBlockComment(stream: StringStream, state: ScilabState): string {
  while (!stream.eol()) {
    if (stream.match('*/')) {
      state.tokenize = tokenBase;
      break;
    }
    stream.next();
  }
  return 'comment';
}

export const scilab: StreamParser<ScilabState> = {
  name: 'scilab',

  startState(): ScilabState {
    return { tokenize: tokenBase };
  },

  token(stream, state) {
    return state.tokenize(stream, state);
  },

  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', "'", '"'] }
  }
};
