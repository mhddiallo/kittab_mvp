import {
  DefaultValueAccessor,
  FormsModule,
  MaxLengthValidator,
  NgControlStatus,
  NgModel
} from "./chunk-BGEFUUPB.js";
import {
  FooterComponent,
  NavbarComponent
} from "./chunk-RF4AULXN.js";
import {
  CommonModule,
  RouterLink,
  __async,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-DPFWTYZM.js";

// src/app/pages/login/login.component.ts
function LoginComponent_Conditional_7_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.error);
  }
}
function LoginComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "h2", 5);
    \u0275\u0275text(2, "Entrez votre num\xE9ro de t\xE9l\xE9phone");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, LoginComponent_Conditional_7_Conditional_3_Template, 2, 1, "div", 6);
    \u0275\u0275elementStart(4, "div", 7)(5, "label", 8);
    \u0275\u0275text(6, "Num\xE9ro de t\xE9l\xE9phone");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "input", 9);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_Conditional_7_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.phone, $event) || (ctx_r1.phone = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "p", 10);
    \u0275\u0275text(9, "Vous recevrez un code par WhatsApp ou SMS");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "button", 11);
    \u0275\u0275listener("click", function LoginComponent_Conditional_7_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.requestOtp());
    });
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "p", 12);
    \u0275\u0275text(13, "Continuer sans compte \u2014 ");
    \u0275\u0275elementStart(14, "a", 13);
    \u0275\u0275text(15, "Parcourir le catalogue");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275conditional(3, ctx_r1.error ? 3 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.phone);
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", ctx_r1.loading);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.loading ? "Envoi..." : "Recevoir le code", " ");
  }
}
function LoginComponent_Conditional_8_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 20);
    \u0275\u0275text(2, "Mode test \u2014 Code : ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "strong", 21);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.devCode);
  }
}
function LoginComponent_Conditional_8_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.error);
  }
}
function LoginComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "button", 14);
    \u0275\u0275listener("click", function LoginComponent_Conditional_8_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.step = "phone");
    });
    \u0275\u0275text(2, "\u2190 Retour");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h2", 15);
    \u0275\u0275text(4, "V\xE9rifiez votre t\xE9l\xE9phone");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 16);
    \u0275\u0275text(6, "Code envoy\xE9 au ");
    \u0275\u0275elementStart(7, "strong");
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275text(9, " par WhatsApp/SMS");
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, LoginComponent_Conditional_8_Conditional_10_Template, 5, 1, "div", 17)(11, LoginComponent_Conditional_8_Conditional_11_Template, 2, 1, "div", 6);
    \u0275\u0275elementStart(12, "div", 7)(13, "label", 8);
    \u0275\u0275text(14, "Code \xE0 6 chiffres");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "input", 18);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_Conditional_8_Template_input_ngModelChange_15_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.otp, $event) || (ctx_r1.otp = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "button", 11);
    \u0275\u0275listener("click", function LoginComponent_Conditional_8_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.verifyOtp());
    });
    \u0275\u0275text(17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "p", 12);
    \u0275\u0275text(19, "Code valable 10 minutes. ");
    \u0275\u0275elementStart(20, "button", 19);
    \u0275\u0275listener("click", function LoginComponent_Conditional_8_Template_button_click_20_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.requestOtp());
    });
    \u0275\u0275text(21, "Renvoyer");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.phone);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(10, ctx_r1.devCode ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(11, ctx_r1.error ? 11 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.otp);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.loading);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.loading ? "V\xE9rification..." : "Valider le code", " ");
  }
}
function LoginComponent_Conditional_9_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.error);
  }
}
function LoginComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "h2", 15);
    \u0275\u0275text(2, "Compl\xE9tez votre profil");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 16);
    \u0275\u0275text(4, "Ces informations permettront aux acheteurs de vous contacter");
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, LoginComponent_Conditional_9_Conditional_5_Template, 2, 1, "div", 6);
    \u0275\u0275elementStart(6, "div", 22)(7, "div")(8, "label", 8);
    \u0275\u0275text(9, "Pr\xE9nom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "input", 23);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_Conditional_9_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.firstName, $event) || (ctx_r1.firstName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div")(12, "label", 8);
    \u0275\u0275text(13, "Nom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "input", 24);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_Conditional_9_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.lastName, $event) || (ctx_r1.lastName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div")(16, "label", 8);
    \u0275\u0275text(17, "Adresse / Ville");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "input", 25);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_Conditional_9_Template_input_ngModelChange_18_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.address, $event) || (ctx_r1.address = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(19, "button", 26);
    \u0275\u0275listener("click", function LoginComponent_Conditional_9_Template_button_click_19_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.completeProfile());
    });
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275conditional(5, ctx_r1.error ? 5 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.firstName);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.lastName);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.address);
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.loading);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.loading ? "Enregistrement..." : "Terminer", " ");
  }
}
var LoginComponent = class _LoginComponent {
  constructor() {
    this.step = "phone";
    this.phone = "";
    this.otp = "";
    this.firstName = "";
    this.lastName = "";
    this.address = "";
    this.loading = false;
    this.devCode = "";
    this.error = "";
  }
  requestOtp() {
    return __async(this, null, function* () {
      if (!this.phone.trim()) {
        this.error = "Veuillez saisir votre num\xE9ro";
        return;
      }
      this.loading = true;
      this.error = "";
      try {
        const res = yield fetch("http://localhost:8000/api/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: this.phone })
        });
        const data = yield res.json();
        if (!res.ok)
          throw new Error(data.detail);
        this.devCode = data.dev_code || "";
        this.step = "otp";
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    });
  }
  verifyOtp() {
    return __async(this, null, function* () {
      if (!this.otp.trim()) {
        this.error = "Veuillez saisir le code OTP";
        return;
      }
      this.loading = true;
      this.error = "";
      try {
        const res = yield fetch("http://localhost:8000/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: this.phone, code: this.otp })
        });
        const data = yield res.json();
        if (!res.ok)
          throw new Error(data.detail);
        localStorage.setItem("token", data.access_token);
        if (data.is_new_user) {
          this.step = "profile";
        } else {
          window.location.href = "/";
        }
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    });
  }
  completeProfile() {
    return __async(this, null, function* () {
      this.loading = true;
      this.error = "";
      try {
        const res = yield fetch("http://localhost:8000/api/auth/complete-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ first_name: this.firstName, last_name: this.lastName, address: this.address })
        });
        if (!res.ok) {
          const d = yield res.json();
          throw new Error(d.detail);
        }
        window.location.href = "/";
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    });
  }
  static {
    this.\u0275fac = function LoginComponent_Factory(t) {
      return new (t || _LoginComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 3, consts: [[1, "min-h-screen", "bg-gray-50", "flex", "items-center", "justify-center", "py-16", "px-4"], [1, "w-full", "max-w-md"], [1, "text-3xl", "font-bold", "text-center", "text-gray-900", "mb-2"], [1, "text-center", "text-gray-500", "text-sm", "mb-8"], [1, "card", "p-8"], [1, "font-semibold", "text-gray-800", "mb-6"], [1, "bg-red-50", "text-red-600", "text-sm", "px-4", "py-3", "rounded-lg", "mb-4"], [1, "mb-4"], [1, "text-sm", "font-medium", "text-gray-700", "block", "mb-1"], ["type", "tel", "placeholder", "+224 XXX XXX XXX", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-3", "text-sm", "focus:outline-none", "focus:border-primary", "focus:ring-1", "focus:ring-primary/20", 3, "ngModelChange", "ngModel"], [1, "text-xs", "text-gray-400", "mt-1"], [1, "btn-primary", "w-full", "text-center", "py-3", "disabled:opacity-60", 3, "click", "disabled"], [1, "text-center", "text-xs", "text-gray-400", "mt-4"], ["routerLink", "/catalogue", 1, "text-primary", "hover:underline"], [1, "text-gray-400", "hover:text-gray-600", "text-sm", "mb-4", "flex", "items-center", "gap-1", 3, "click"], [1, "font-semibold", "text-gray-800", "mb-1"], [1, "text-gray-500", "text-sm", "mb-6"], [1, "bg-blue-50", "border", "border-blue-200", "rounded-xl", "px-4", "py-3", "mb-4", "text-sm"], ["type", "text", "maxlength", "6", "placeholder", "000000", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-3", "text-center", "text-2xl", "tracking-widest", "font-bold", "focus:outline-none", "focus:border-primary", 3, "ngModelChange", "ngModel"], [1, "text-primary", "hover:underline", 3, "click"], [1, "text-blue-600", "font-medium"], [1, "text-blue-800", "text-lg", "tracking-widest"], [1, "space-y-4"], ["type", "text", "placeholder", "Votre pr\xE9nom", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-3", "text-sm", "focus:outline-none", "focus:border-primary", 3, "ngModelChange", "ngModel"], ["type", "text", "placeholder", "Votre nom", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-3", "text-sm", "focus:outline-none", "focus:border-primary", 3, "ngModelChange", "ngModel"], ["type", "text", "placeholder", "Ex: Conakry, Ratoma", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-3", "text-sm", "focus:outline-none", "focus:border-primary", 3, "ngModelChange", "ngModel"], [1, "btn-primary", "w-full", "text-center", "py-3", "mt-6", "disabled:opacity-60", 3, "click", "disabled"]], template: function LoginComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "app-navbar");
        \u0275\u0275elementStart(1, "div", 0)(2, "div", 1)(3, "h1", 2);
        \u0275\u0275text(4, "Se connecter");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Acc\xE9dez \xE0 votre compte KITTAB");
        \u0275\u0275elementEnd();
        \u0275\u0275template(7, LoginComponent_Conditional_7_Template, 16, 4, "div", 4)(8, LoginComponent_Conditional_8_Template, 22, 6, "div", 4)(9, LoginComponent_Conditional_9_Template, 21, 6, "div", 4);
        \u0275\u0275elementEnd()();
        \u0275\u0275element(10, "app-footer");
      }
      if (rf & 2) {
        \u0275\u0275advance(7);
        \u0275\u0275conditional(7, ctx.step === "phone" ? 7 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(8, ctx.step === "otp" ? 8 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(9, ctx.step === "profile" ? 9 : -1);
      }
    }, dependencies: [RouterLink, CommonModule, FormsModule, DefaultValueAccessor, NgControlStatus, MaxLengthValidator, NgModel, NavbarComponent, FooterComponent], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src/app/pages/login/login.component.ts", lineNumber: 14 });
})();
export {
  LoginComponent
};
//# sourceMappingURL=chunk-QCMM4WJP.js.map
