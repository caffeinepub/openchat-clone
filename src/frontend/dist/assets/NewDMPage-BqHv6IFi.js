import { c as createLucideIcon, b as useNavigate, g as useCreateDirectConversation, r as reactExports, j as jsxRuntimeExports, I as Input, B as Button, L as LoaderCircle } from "./index-DgOxEGaG.js";
import { A as ArrowLeft } from "./arrow-left-SfmEPs7U.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }],
  ["path", { d: "M12 7v6", key: "lw1j43" }],
  ["path", { d: "M9 10h6", key: "9gxzsh" }]
];
const MessageSquarePlus = createLucideIcon("message-square-plus", __iconNode);
function NewDMPage() {
  const navigate = useNavigate();
  const createDM = useCreateDirectConversation();
  const [principalId, setPrincipalId] = reactExports.useState("");
  const [touched, setTouched] = reactExports.useState(false);
  const [serverError, setServerError] = reactExports.useState(null);
  const isEmpty = principalId.trim().length === 0;
  const showEmptyError = touched && isEmpty;
  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (isEmpty) return;
    createDM.mutate(
      { otherUserId: principalId.trim(), displayName: principalId.trim() },
      {
        onSuccess: (conv) => {
          navigate({ to: "/conversations/$id", params: { id: conv.id } });
        },
        onError: () => {
          setServerError("Failed to create conversation. Please try again.");
        }
      }
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col h-full bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-6 py-4 border-b border-border bg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => navigate({ to: "/conversations" }),
          className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
          "aria-label": "Back to conversations",
          "data-ocid": "new-dm-back-btn",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-base text-foreground leading-tight", children: "New Direct Message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Start a private conversation" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col items-center justify-start pt-10 px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquarePlus, { className: "w-7 h-7 text-primary" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "principal-id",
              className: "block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide",
              children: "User Principal ID"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "principal-id",
              value: principalId,
              onChange: (e) => {
                setPrincipalId(e.target.value);
                setServerError(null);
              },
              onBlur: () => setTouched(true),
              placeholder: "e.g. rdmx6-jaaaa-aaaaa-aaadq-cai",
              "data-ocid": "new-dm-principal-input",
              className: `h-11 bg-card font-mono text-sm ${showEmptyError ? "border-destructive focus-visible:ring-destructive" : "border-border"}`,
              "aria-describedby": showEmptyError ? "principal-error" : void 0,
              "aria-invalid": showEmptyError,
              autoFocus: true
            }
          ),
          showEmptyError && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "principal-error",
              role: "alert",
              className: "text-xs text-destructive font-display",
              children: "Principal ID is required"
            }
          ),
          serverError && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              role: "alert",
              className: "text-xs text-destructive font-display",
              children: serverError
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Paste the Internet Computer principal ID of the person you want to message." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => navigate({ to: "/conversations" }),
              className: "flex-1 h-11 font-display font-semibold",
              "data-ocid": "new-dm-cancel-btn",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "submit",
              disabled: createDM.isPending,
              className: "flex-1 h-11 font-display font-semibold",
              "data-ocid": "new-dm-submit-btn",
              children: createDM.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                "Creating…"
              ] }) : "Start Conversation"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  NewDMPage as default
};
