// fake e.isTrusted = true
(function () {
  console.log("[Bypass] Overriding isTrusted");

  Element.prototype._addEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function () {
    const args = [...arguments];
    const eventType = args[0];
    const originalHandler = args[1];

    console.log(`[Bypass] Adding event listener for type: ${eventType}`);

    args[1] = function () {
      const args2 = [...arguments];
      args2[0] = Object.assign({}, args2[0]);
      args2[0].isTrusted = true;
      console.log(`[Bypass] Call event listener for type: ${eventType}`,originalHandler);
      return originalHandler(...args2);
    };

    return this._addEventListener(...args);
  };
})();