'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check').default;

var _regeneratorRuntime = require('babel-runtime/regenerator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

exports.__esModule = true;

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _wd = require('wd');

var _wd2 = _interopRequireDefault(_wd);

var _lodash = require('lodash');

var _utilsWait = require('./utils/wait');

var _utilsWait2 = _interopRequireDefault(_utilsWait);

var _readFileRelative = require('read-file-relative');

var _sauceConnectLauncher = require('sauce-connect-launcher');

var _sauceConnectLauncher2 = _interopRequireDefault(_sauceConnectLauncher);

var _sauceStorage = require('./sauce-storage');

var _sauceStorage2 = _interopRequireDefault(_sauceStorage);

var _sauceHost = require('./sauce-host');

var PRERUN_SCRIPT_DIR_PATH = _readFileRelative.toAbsPath('./prerun/');
var DISABLE_COMPATIBILITY_MODE_IE_SCRIPT_FILENAME = 'disable-intranet-compatibility-mode-in-ie.bat';

var WEB_DRIVER_IDLE_TIMEOUT = 1000;
var WEB_DRIVER_PING_INTERVAL = 5 * 60 * 1000;
var WEB_DRIVER_CONFIGURATION_RETRY_DELAY = 30 * 1000;
var WEB_DRIVER_CONFIGURATION_RETRIES = 3;
var WEB_DRIVER_CONFIGURATION_TIMEOUT = 9 * 60 * 1000;

// NOTE: When using Appium on Android devices, the device browser navigates to 'https://google.com' after being started.
// So we need to route traffic directly to Google servers to avoid re-signing it with Saucelabs SSL certificates.
// https://support.saucelabs.com/customer/portal/articles/2005359-some-https-sites-don-t-work-correctly-under-sauce-connect
var DEFAULT_DIRECT_DOMAINS = ['*.google.com', '*.gstatic.com', '*.googleapis.com'];

var requestPromised = _pify2.default(_request2.default, _pinkie2.default);

function createSauceConnectProcess(options) {
    return new _pinkie2.default(function (resolve, reject) {
        _sauceConnectLauncher2.default(options, function (err, process) {
            if (err) {
                reject(err);
                return;
            }

            resolve(process);
        });
    });
}

function disposeSauceConnectProcess(process) {
    return new _pinkie2.default(function (resolve) {
        process.close(resolve);
    });
}

var SaucelabsConnector = (function () {
    function SaucelabsConnector(username, accessKey) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        _classCallCheck(this, SaucelabsConnector);

        this.username = username;
        this.accessKey = accessKey;
        this.tunnelIdentifier = Date.now();

        var _options$connectorLogging = options.connectorLogging;
        var connectorLogging = _options$connectorLogging === undefined ? true : _options$connectorLogging;
        var _options$tunnelLogging = options.tunnelLogging;
        var tunnelLogging = _options$tunnelLogging === undefined ? false : _options$tunnelLogging;
        var _options$directDomains = options.directDomains;
        var directDomains = _options$directDomains === undefined ? DEFAULT_DIRECT_DOMAINS : _options$directDomains;
        var _options$noSSLBumpDomains = options.noSSLBumpDomains;
        var noSSLBumpDomains = _options$noSSLBumpDomains === undefined ? [] : _options$noSSLBumpDomains;

        this.sauceConnectOptions = {
            username: this.username,
            accessKey: this.accessKey,
            tunnelIdentifier: this.tunnelIdentifier,
            directDomains: directDomains.join(','),
            logfile: tunnelLogging ? 'sc_' + this.tunnelIdentifier + '.log' : null
        };

        if (noSSLBumpDomains.length) this.sauceConnectOptions.noSslBumpDomains = noSSLBumpDomains.join(',');

        this.sauceConnectProcess = null;

        this.sauceStorage = new _sauceStorage2.default(this.username, this.accessKey);

        _wd2.default.configureHttp({
            retryDelay: WEB_DRIVER_CONFIGURATION_RETRY_DELAY,
            retries: WEB_DRIVER_CONFIGURATION_RETRIES,
            timeout: WEB_DRIVER_CONFIGURATION_TIMEOUT
        });

        this.options = { connectorLogging: connectorLogging };
    }

    SaucelabsConnector.prototype._log = function _log(message) {
        if (this.options.connectorLogging) process.stdout.write(message + '\n');
    };

    /* SaucelabsConnector.prototype._getFreeMachineCount = function _getFreeMachineCount() {
        var params, response;
        return _regeneratorRuntime.async(function _getFreeMachineCount$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    params = {
                        method: 'GET',
                        url: ['https://' + _sauceHost.SAUCE_API_HOST + '/rest/v1/users', this.username, 'concurrency'].join('/'),
                        auth: { user: this.username, pass: this.accessKey }
                    };
                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(requestPromised(params));

                case 3:
                    response = context$2$0.sent;
                    return context$2$0.abrupt('return', JSON.parse(response.body).concurrency[this.username].remaining.overall);

                case 5:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };
    */

    SaucelabsConnector.prototype._getFreeMachineCount = function _getFreeMachineCount() {
        var params, response, organization, allowed, current;
        return _regeneratorRuntime.async(function _getFreeMachineCount$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    params = {
                        method: 'GET',
                        url: ['https://' + _sauceHost.SAUCE_API_HOST + '/rest/v1.2/users', this.username, 'concurrency'].join('/'),
                        auth: { user: this.username, pass: this.accessKey }
                    };
                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(requestPromised(params));

                case 3:
                    response = context$2$0.sent;
                    organization = JSON.parse(response.body).concurrency.organization;
                    allowed = organization.allowed.vms;
                    current = organization.current.vms;
                    return context$2$0.abrupt('return', allowed - current);

                case 8:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.getSessionUrl = function getSessionUrl(browser) {
        var sessionId;
        return _regeneratorRuntime.async(function getSessionUrl$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(browser.getSessionId());

                case 2:
                    sessionId = context$2$0.sent;
                    return context$2$0.abrupt('return', 'https://app.' + _sauceHost.SAUCE_API_HOST + '/tests/' + sessionId);

                case 4:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.startBrowser = function startBrowser(browser, url) {
        var timeout = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

        var _ref,
            jobName,
            tags,
            build,
            webDriver,
            pingWebDriver,
            initParams,
            args$2$0 = arguments;

        return _regeneratorRuntime.async(function startBrowser$(context$2$0) {
            var _this = this;

            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    _ref = args$2$0.length <= 2 || args$2$0[2] === undefined ? {} : args$2$0[2];
                    jobName = _ref.jobName;
                    tags = _ref.tags;
                    build = _ref.build;
                    webDriver = _wd2.default.promiseChainRemote('ondemand.' + _sauceHost.SAUCE_API_HOST, 80, this.username, this.accessKey);

                    pingWebDriver = function () {
                        return webDriver.eval('');
                    };

                    webDriver.once('status', function () {
                        // HACK: if the webDriver doesn't get any command within 1000s, it fails
                        // with the timeout error. We should send any command to avoid this.
                        webDriver.pingIntervalId = setInterval(pingWebDriver, WEB_DRIVER_PING_INTERVAL);

                        if (_this.options.connectorLogging) {
                            _this.getSessionUrl(webDriver).then(function (sessionUrl) {
                                return _this._log(browser.browserName + ' started. See ' + sessionUrl);
                            });
                        }
                    });

                    initParams = {
                        name: jobName,
                        tags: tags,
                        build: build,
                        tunnelIdentifier: this.tunnelIdentifier,
                        idleTimeout: WEB_DRIVER_IDLE_TIMEOUT
                    };

                    _lodash.assign(initParams, browser);

                    if (timeout) initParams.maxDuration = timeout;

                    // NOTE: If IE11 is used, the "Display intranet sites in Compatibility View" option should be disabled.
                    // We do this this via the 'prerun' parameter, which should run our script on the Sauce Labs side,
                    // before the browser starts.

                    if (!(browser.browserName.toLowerCase() === 'internet explorer' && /11(\.\d*)?$/.test(browser.version))) {
                        context$2$0.next = 17;
                        break;
                    }

                    context$2$0.next = 13;
                    return _regeneratorRuntime.awrap(this.sauceStorage.isFileAvailable(DISABLE_COMPATIBILITY_MODE_IE_SCRIPT_FILENAME));

                case 13:
                    if (context$2$0.sent) {
                        context$2$0.next = 16;
                        break;
                    }

                    context$2$0.next = 16;
                    return _regeneratorRuntime.awrap(this.sauceStorage.uploadFile(PRERUN_SCRIPT_DIR_PATH, DISABLE_COMPATIBILITY_MODE_IE_SCRIPT_FILENAME));

                case 16:

                    initParams.prerun = 'sauce-storage:' + DISABLE_COMPATIBILITY_MODE_IE_SCRIPT_FILENAME;

                case 17:
                    context$2$0.next = 19;
                    return _regeneratorRuntime.awrap(webDriver.init(initParams).get(url));

                case 19:
                    return context$2$0.abrupt('return', webDriver);

                case 20:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.stopBrowser = function stopBrowser(browser) {
        return _regeneratorRuntime.async(function stopBrowser$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    clearInterval(browser.pingIntervalId);

                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(browser.quit().sauceJobStatus());

                case 3:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.connect = function connect() {
        return _regeneratorRuntime.async(function connect$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(createSauceConnectProcess(this.sauceConnectOptions));

                case 2:
                    this.sauceConnectProcess = context$2$0.sent;

                case 3:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.disconnect = function disconnect() {
        return _regeneratorRuntime.async(function disconnect$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(disposeSauceConnectProcess(this.sauceConnectProcess));

                case 2:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SaucelabsConnector.prototype.waitForFreeMachines = function waitForFreeMachines(machineCount, requestInterval, maxAttemptCount) {
        var attempts, freeMachineCount;
        return _regeneratorRuntime.async(function waitForFreeMachines$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    attempts = 0;

                case 1:
                    if (!(attempts < maxAttemptCount)) {
                        context$2$0.next = 13;
                        break;
                    }

                    context$2$0.next = 4;
                    return _regeneratorRuntime.awrap(this._getFreeMachineCount());

                case 4:
                    freeMachineCount = context$2$0.sent;

                    if (!(freeMachineCount >= machineCount)) {
                        context$2$0.next = 7;
                        break;
                    }

                    return context$2$0.abrupt('return');

                case 7:

                    this._log('The number of free machines (' + freeMachineCount + ') is less than requested (' + machineCount + ').');

                    context$2$0.next = 10;
                    return _regeneratorRuntime.awrap(_utilsWait2.default(requestInterval));

                case 10:
                    attempts++;
                    context$2$0.next = 1;
                    break;

                case 13:
                    throw new Error('There are no free machines');

                case 14:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    return SaucelabsConnector;
})();

exports.default = SaucelabsConnector;
module.exports = exports.default;

// NOTE: We should upload the script to the sauce storage if it's not there yet.
