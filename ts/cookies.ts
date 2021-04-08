"use strict";

var cookies = {
  get areAllowed () {
    return localStorage.allowCookies === "true";
  },
  set areAllowed (value) {
    localStorage.allowCookies = value;
    this.hideBanner();
  },
  hideBanner () {
    this.banner.style.display = "none";
  },
  banner: document.getElementsByTagName("footer")[0]
};

document.getElementById("accept-cookies")!.addEventListener("click", () => {
  cookies.areAllowed = true;
});
document.getElementById("deny-cookies")!.addEventListener("click", () => {
  cookies.areAllowed = false;
});
if (cookies.areAllowed) cookies.hideBanner(); 