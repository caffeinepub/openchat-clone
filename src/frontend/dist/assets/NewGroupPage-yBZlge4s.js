import { b as useNavigate, h as useCreateGroupConversation, r as reactExports, j as jsxRuntimeExports, U as Users, I as Input, T as Textarea, B as Button, L as LoaderCircle } from "./index-Ci4uK3eq.js";
import { A as ArrowLeft } from "./arrow-left-BkarBs9F.js";
function parsePrincipalIds(raw) {
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}
function NewGroupPage() {
  const navigate = useNavigate();
  const createGroup = useCreateGroupConversation();
  const [groupName, setGroupName] = reactExports.useState("");
  const [membersRaw, setMembersRaw] = reactExports.useState("");
  const [nameTouched, setNameTouched] = reactExports.useState(false);
  const [membersTouched, setMembersTouched] = reactExports.useState(false);
  const [serverError, setServerError] = reactExports.useState(null);
  const nameEmpty = groupName.trim().length === 0;
  const memberIds = parsePrincipalIds(membersRaw);
  const membersEmpty = memberIds.length === 0;
  const showNameError = nameTouched && nameEmpty;
  const showMembersError = membersTouched && membersEmpty;
  const handleSubmit = (e) => {
    e.preventDefault();
    setNameTouched(true);
    setMembersTouched(true);
    setServerError(null);
    if (nameEmpty || membersEmpty) return;
    createGroup.mutate(
      { name: groupName.trim(), memberIds },
      {
        onSuccess: (conv) => {
          navigate({ to: "/conversations/$id", params: { id: conv.id } });
        },
        onError: () => {
          setServerError("Failed to create group. Please try again.");
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
          "data-ocid": "new-group-back-btn",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-base text-foreground leading-tight", children: "New Group Chat" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Create a group conversation" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col items-center justify-start pt-10 px-6 overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md pb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-7 h-7 text-primary" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "label",
            {
              htmlFor: "group-name",
              className: "block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide",
              children: "Group Name"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "group-name",
              value: groupName,
              onChange: (e) => {
                setGroupName(e.target.value);
                setServerError(null);
              },
              onBlur: () => setNameTouched(true),
              placeholder: "e.g. Protocol Research",
              "data-ocid": "new-group-name-input",
              className: `h-11 bg-card ${showNameError ? "border-destructive focus-visible:ring-destructive" : "border-border"}`,
              "aria-describedby": showNameError ? "group-name-error" : void 0,
              "aria-invalid": showNameError,
              autoFocus: true
            }
          ),
          showNameError && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "group-name-error",
              role: "alert",
              className: "text-xs text-destructive font-display",
              children: "Group name is required"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "label",
            {
              htmlFor: "group-members",
              className: "block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide",
              children: [
                "Member Principal IDs",
                memberIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-primary normal-case font-normal", children: [
                  "— ",
                  memberIds.length,
                  " member",
                  memberIds.length !== 1 ? "s" : ""
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "group-members",
              value: membersRaw,
              onChange: (e) => {
                setMembersRaw(e.target.value);
                setServerError(null);
              },
              onBlur: () => setMembersTouched(true),
              placeholder: "rdmx6-jaaaa-aaaaa-aaadq-cai, abc12-xyz99-…",
              "data-ocid": "new-group-members-input",
              rows: 4,
              className: `bg-card font-mono text-sm resize-none ${showMembersError ? "border-destructive focus-visible:ring-destructive" : "border-border"}`,
              "aria-describedby": showMembersError ? "members-error" : "members-hint",
              "aria-invalid": showMembersError
            }
          ),
          showMembersError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "members-error",
              role: "alert",
              className: "text-xs text-destructive font-display",
              children: "At least one member principal ID is required"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "members-hint", className: "text-xs text-muted-foreground", children: "Separate multiple principal IDs with commas." })
        ] }),
        serverError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "text-xs text-destructive font-display", children: serverError }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => navigate({ to: "/conversations" }),
              className: "flex-1 h-11 font-display font-semibold",
              "data-ocid": "new-group-cancel-btn",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "submit",
              disabled: createGroup.isPending,
              className: "flex-1 h-11 font-display font-semibold",
              "data-ocid": "new-group-submit-btn",
              children: createGroup.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                "Creating…"
              ] }) : "Create Group"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  NewGroupPage as default
};
