var app = {
    settings: {
        ENV: null,
        ASSETS_URL: '',
        API_SERVER_URL: '',
        COOKIE_TOKEN: '',
        COOKIE_USER: ''
    },

    constants: {
        DEFAULT_ERROR_CODE: 1,
        ALERT_TIMEOUT: 3000,
        FADING_DURATION: 350,

        timeIncrementProcessor: {
            MAX_ELAPSED_AUTO_INCREMENT: 60 * 60 * 5, // 5 hours
            UPDATE_INTERVAL: 8888
        },

        regexp: {
            WEB_ADDRESS: /^\s*(http\:\/\/)?([a-z\d\-]{1,63}\.)*[a-z\d\-]{1,255}\.[a-z]{2,6}\s*$/,
            PHONE_NUMBER: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
            TIME_12: /^\d{1,2}:\d{2}\s?(AM|PM)$/i,
            ACCEPTABLE_IMAGES: /^(gif|jpe?g|png)$/i,
            URLS_WITHOUT_AUTHORIZATION: /^\/(login|signup)?([\?\/].*)?$/i
        },

        http: {
            METHOD_POST: 'POST',
            METHOD_GET: 'GET',
            METHOD_DELETE: 'DELETE',
            METHOD_PUT: 'PUT'
        },

        keyCode: {
            ENTER: 13,
            ESC: 27
        },

        shortMonth: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        longMonth: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Sepember', 'October', 'November', 'December'],

        interval: {
            SECOND: 1,
            MINUTE: 60,
            HOUR: 60 * 60,
            DAY: 60 * 60 * 24,
            WEEK: 60 * 60 * 24 * 7,
            MONTH: 60 * 60 * 24 * 7 * 30,
            YEAR: 60 * 60 * 24 * 7 * 30 * 12
        }
    },

    userContext: null,

    screens: {},

    /* Logging framework
    ------------------------------------------------------------------------------------------------------------------*/
    _logger: null,

    log: function() {
        if (!app._logger) {
            if (typeof log4javascript !== 'undefined') {
                app._logger = log4javascript.getLogger();
                var consoleAppender = new log4javascript.BrowserConsoleAppender();
                var consoleLayout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m{10}");
                consoleAppender.setLayout(consoleLayout);
                app._logger.addAppender(consoleAppender);
                // Enable logging only in development mode.
                if (app.settings.ENV !== 'development') {
                    log4javascript.setEnabled(false);
                }
            } else {
                console.error('Logging framework log4javascript is undefined.');
            }
        }
        return app._logger;
    },

    analytics: {
        parseUrl: function(url) {
            if (util.strings.isBlank(url)) {
                return 'unknown';
            }
            return url.replace(/[0-9]+/g, '_');
        },

        trackApi: function(source, type, url, data) {
            source = $(source);
            this.track(
                'event',
                source.length ? source[0].tagName : 'undefined',
                'commit',
                this.parseUrl(url));
        },

        track: function(hitType, eventCategory, eventAction, eventLabel, eventValue) {
            if (ga) {
                var eventData = {
                    'hitType': hitType, // Required.
                    'eventCategory': eventCategory, // Required.
                    'eventAction': eventAction, // Required.
                    'eventLabel': eventLabel,
                    'eventValue': eventValue
                };

                ga('send', eventData);
                app.log().info('Event tracking', eventData);
            }
        }
    },

    /* Main functionality to make ajax requests
    ------------------------------------------------------------------------------------------------------------------*/
    /**
     * Base method to make Ajax requests both to the inner (node.js) and to the api (java) servers.
     *
     * @param source            context of executing request (button, form, span, ...)
     * @param method            http method (POST, GET, ...)
     * @param expectedDataType  type of the data expected from server
     * @param url               url to send request
     * @param async             asynchronous (true) or not (false) request
     * @param data              request parameters that will be sent on server
     * @param headers           additional header key/value pairs
     * @param successHandler    invokes when ajax request successfully completed
     * @param errorHandler      invokes when ajax request failed
     * @param completeHandler   invokes always after ending request
     * @private
     */
    _ajax: function(source, method, expectedDataType, url, async, data, headers, successHandler, errorHandler, completeHandler) {
        var params = {
            type: method || app.constants.http.METHOD_GET,
            url: url,
            async: Boolean(async),
            data: data || {},
            dataType: expectedDataType || 'json',
            headers: headers
        };

        var globalStatus = $('#ajax-global-status'); // indicator to show that browser is processing ajax request
        $.ajax({
            type: params.type,
            url: params.url,
            async: params.async,
            data: params.data,
            dataType: params.dataType,
            headers: params.headers,
            beforeSend: function() {
                if (globalStatus.length && !globalStatus.is(':visible')) {
                    globalStatus.fadeIn('fast');
                }
            },
            success: function(data) {
                var logReq = params;
                if (params.dataType === 'json') {
                    logReq = {
                        request: params,
                        result: data
                    };
                }
                app.log().info("Ajax request successfully completed", logReq);
                if (successHandler) {
                    successHandler(data);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                app.log().error('Ajax request failed', params, '\n', errorThrown);
                if (errorHandler) {
                    errorHandler();
                } else if (!util.strings.isBlank(errorThrown)) {
                    app.alerts.showErrorAlert(errorThrown);
                }
            },
            complete: function() {
                if (globalStatus.length && globalStatus.is(':visible')) {
                    globalStatus.fadeOut('fast');
                }
                if (completeHandler) {
                    completeHandler();
                }
            }
        });

        app.analytics.trackApi(source, method, url, data);
    },

    ajax: function(source, type, dataType, url, data, successHandler, errorHandler, completeHandler) {
        app._ajax(source, type, dataType, url, true, data, null, successHandler, errorHandler, completeHandler);
    },

    ajaxAsync: function(source, type, dataType, url, data, successHandler, errorHandler, completeHandler) {
        app._ajax(source, type, dataType, url, false, data, null, successHandler, errorHandler, completeHandler);
    },

    request: function(source, type, url, data, apiSuccessHandler, apiErrorHandler) {
        var submits = util.forms.findSubmits(source);
        if (!submits.hasClass('disabled')) {
            submits.addClass('disabled');
            app.ajax(source, type, 'json', url, data, function(res) {
                app.api._apiResponseHandler(res, apiSuccessHandler, apiErrorHandler);
            }, null, function() {
                submits.removeClass('disabled');
            });
        }
    },

    api: {
        ajax: function(source, type, url, data, successHandler, errorHandler, completeHandler) {
            var headers = {
                'api-token': $.cookie(app.settings.COOKIE_TOKEN)
            };
            var _url = app.settings.API_SERVER_URL + url;
            app._ajax(source, type, 'json', _url, true, data, headers, successHandler, errorHandler, completeHandler);
        },

        _apiResponseHandler: function(resJson, apiSuccessHandler, apiErrorHandler) {
            if (resJson.status === 'success') {
                if (apiSuccessHandler) {
                    apiSuccessHandler(resJson);
                } else if (!util.strings.isBlank(resJson.message)) {
                    app.alerts.showSuccessAlert(resJson.message);
                }
            } else if (resJson.status === 'error') {
                if (apiErrorHandler) {
                    apiErrorHandler(resJson);
                } else if (!util.strings.isBlank(resJson.error.message) || resJson.error.code) {
                    app.alerts.showErrorAlert(resJson.error.message, resJson.error.code);
                }
            } else {
                app.log().error("Unknown status of API response.", resJson);
            }
        },

        post: function(source, url, data, apiSuccessHandler, apiErrorHandler) {
            app.api.ajax(source, app.constants.http.METHOD_POST, url, data, function(resJson) {
                app.api._apiResponseHandler(resJson, apiSuccessHandler, apiErrorHandler);
            });
        },

        get: function(source, url, data, apiSuccessHandler, apiErrorHandler) {
            app.api.ajax(source, app.constants.http.METHOD_GET, url, data, function(resJson) {
                app.api._apiResponseHandler(resJson, apiSuccessHandler, apiErrorHandler);
            });
        }
    },

    /**
     * Executes updating operation for the given field.
     * Parameters of request are defined by dataset attributes of the field.
     *
     * @param additionalData object with data that will be appended to the field data.
     */
    executeFieldUpdate: function(field, additionalData) {
        field = $(field);
        if (!field.length) {
            return false;
        }
        var dataNameAttr = 'name',
            dataUpdateActionAttr = 'update-action';
        for (var i = 0; i < field.length; i++) {
            var dataName = app.dataAttr.get(field, dataNameAttr);
            var dataUpdateAction = app.dataAttr.get(field, dataUpdateActionAttr);
            if (dataName && dataUpdateAction) {
                var dataValue = util.html.getElValOrText(field);
                dataValue = util.strings.escape(dataValue);
                var sendData = {};
                sendData[dataName] = dataValue;
                // Append additional data if defined
                if (additionalData) {
                    for (var paramName in additionalData) {
                        if (additionalData.hasOwnProperty(paramName)) {
                            sendData[paramName] = additionalData[paramName];
                        }
                    }
                }
                app.api.post(field, dataUpdateAction, sendData);
            } else {
                app.log().error("To update field should have '" + dataNameAttr + "' and '" + dataUpdateActionAttr + "' data attributes.");
            }
        }
    },

    alerts: {
        showSuccessAlert: function(message) {
            var alertContainer = $("<div class='alert alert-success global-alert'>").text(message);
            app.alerts._displayAlert(alertContainer);
        },

        showWarningAlert: function(message) {
            var alertContainer = $("<div class='alert alert-warning global-alert'>").text(message);
            app.alerts._displayAlert(alertContainer);
        },

        showErrorAlert: function(message, errorCode) {
            var alertContainer = $("<div class='alert alert-danger global-alert error-" + (errorCode || app.constants.DEFAULT_ERROR_CODE) + "'>").text(message);
            app.alerts._displayAlert(alertContainer);
        },

        _displayAlert: function(alert) {
            var globalAlertsContainer = $('#global-alerts-container');
            if (!globalAlertsContainer.length) {
                globalAlertsContainer = $("<div id='global-alerts-container' class='global-alerts-container'>").appendTo($('body'));
            }
            alert.appendTo(globalAlertsContainer).fadeIn(app.constants.FADING_DURATION);
            setTimeout(function() {
                alert.fadeOut(app.constants.FADING_DURATION, function() {
                    alert.remove();
                });
            }, app.constants.ALERT_TIMEOUT);
        }
    },

    modalWindows: {
        showDialog: function(dialogView, options, initialize, onOkayHandler, onCancelHandler) {
            util.templating.renderView('/views/dialog/' + dialogView, options, function(partial) {
                var modal = $(partial);
                var okayButton = modal.find('.btn-primary:first');

                modal.appendTo($(document).find('body:first'));

                var onConfirmHandler = function() {
                    if (onOkayHandler)
                        onOkayHandler(modal);

                    modal.modal('hide');
                };

                var onKeyHandler = function(e) {
                    if (e.keyCode == app.constants.keyCode.ENTER) {
                        okayButton.click();
                    } else if (e.keyCode == app.constants.keyCode.ESC) {
                        modal.modal('hide');
                    }
                };

                var cleanUp = function() {
                    $(document).unbind('keydown', onKeyHandler);
                    okayButton.unbind('click', onConfirmHandler);
                    if (onCancelHandler) onCancelHandler(modal);

                    modal.remove();
                };

                okayButton.bind('click', onConfirmHandler);
                if (initialize) initialize(modal);

                modal.modal({
                    keyboard: false
                }).on('hidden.bs.modal', function() {
                    cleanUp();
                }).on('shown.bs.modal', function() {
                    $(document).bind('keydown', onKeyHandler);
                });
            });
        },

        confirm: function(options, onOkayHandler) {
            if (!options || !options.title || !options.question || !onOkayHandler) return;

            app.modalWindows.showDialog('_confirm-dialog', options, null, onOkayHandler);
        }
    },

    preview: function(title, url) {
        if (!title || !url) return;

        var emu = null;

        app.modalWindows.showDialog('_preview-dialog', {
            title: title,
            traffic: {
                phone: 19,
                tablet: 10,
                pc: 71
            }
        }, function(modal) {
            var thumbnails = modal.find('.modal-body .thumbnail');
            thumbnails.click(function() {
                var self = $(this);
                self.parents('.row:first').find('.active').removeClass('active');
                self.addClass('active');
                return false;
            });
        }, function(modal) {
            var selected = modal.find('.thumbnail.active:first');
            emu = app.dataAttr.get(selected, 'emu');
        }, function() {
            if (!emu) return;

            app.modalWindows.showDialog('_emu-dialog', {
                title: emu,
                src: url,
                emu: emu
            }, function(modalEmu) {
                setTimeout(function() {
                    modalEmu.find('button.close:first').tooltip('show');
                }, app.constants.ALERT_TIMEOUT);
            });
        });
    },

    checkPermissions: function(path) {
        return app.userContext || path.match(app.constants.regexp.URLS_WITHOUT_AUTHORIZATION);
    },

    baseInitializeContext: function() {
        var cookie = $.cookie(app.settings.COOKIE_USER);
        if (cookie && cookie !== 'undefined') {
            app.userContext = JSON.parse(cookie);
        }

        var path = util.http.getPath();

        /*if (!this.checkPermissions(path)) {
            util.http.redirectTo('/login');
            return;
        }*/

        var baseUrl = function(url) {
            return url.replace(/[0-9s/]/g, '');
        };

        // top nav bar selection based on url
        var links = $('.navbar ul.nav > li > a');
        for (var i = 0; i < links.length; i++) {
            var link = $(links[i]);
            if (baseUrl(link.attr('href')) == baseUrl(path)) {
                link.parent().addClass('selected');
            }
        }
    },

    /*
        runs after document ready, and template rendered
    */
    initializeView: function(view) {
        if (view == null) view = $(document);
        else view = $(view);
        // Editable fields.
        var editableFields = view.find("[contenteditable]");
        editableFields.not('input, textarea').trigger("change"); // hack to apply placeholders
        editableFields.each(function() {
            var editableField = $(this);
            util.html.editableFieldProcessor(editableField, function() {
                app.executeFieldUpdate(editableField);
            });
        });

        view.find('.date-picker').datepicker()
            .on('changeDate', function(ev) {
                $(this).blur(); //to mimic user typing in
            });
        view.find('.time-picker').timepicker()
            .on('hide.timepicker', function(e) {
                $(this).blur(); //to mimic user typing in
            });

        view.find('.switch')
            .on('switch-change', function(e, data) {
                $(this).find("input:first").val(data.value).blur(); //mimic user blurring
            });

        view.find('textarea.form-control').autosize();

        // Ratings stars initialization.
        util.html.calendar(view);
        util.html.avatar(view);
        util.html.starify(view.find('.stars'));
        util.html.addReturnIcon(view.find('.return-submit'));
        util.html.time(view);
        util.html.initCustomElements(view);

        if (util.dimension.desktop()) {
            // Bootstrap tooltips initialization.
            var noTooltipFor = '#recaptcha_reload_btn, ' +
                '#recaptcha_switch_audio_btn, ' +
                '#recaptcha_switch_img_btn, ' +
                '#recaptcha_whatsthis_btn';

            view.find('[title]').not(noTooltipFor).tooltip();
        }
        return view;
    },

    initializeScreens: function() {
        var loadedScreens = [];
        var bindRoutes = typeof(Path) !== 'undefined';

        for (var key in app.screens) {
            if (!app.screens.hasOwnProperty(key)) continue;
            var screen = app.screens[key];

            if (!screen.viewClass) {
                app.log().debug('screen viewClass missing');
                continue;
            }

            screen.view = $('.' + screen.viewClass);
            if (screen.view.length == 0) {
                app.log().debug('viewClass: ' + screen.viewClass + ' is not found.');
                continue;
            }

            if (screen.initialize) screen.initialize();

            var bindRoute = function(sc, route) {
                if (route.path && route.controller)
                    Path.map(route.path).to(function() {
                        route.controller.call(sc, this);
                    });
            };

            if (bindRoutes && screen.routes) {
                for (var i = 0; i < screen.routes.length; i++) {
                    bindRoute(screen, screen.routes[i]);
                }
            }

            loadedScreens.push(screen);
        }

        for (var i = 0; i < loadedScreens.length; i++) {
            if (loadedScreens[i].finalize) loadedScreens[i].finalize();

            if (bindRoutes) {
                if (loadedScreens[i].rootPath)
                    Path.root(loadedScreens[i].rootPath);
            }
        }

        Path.listen();
    },

    /* Methods to work with data attributes with specific product prefix
    ------------------------------------------------------------------------------------------------------------------*/
    dataAttr: {
        _prefix: 'oc-',

        fullName: function(name) {
            return 'data-' + this.withPrefix(name);
        },

        withPrefix: function(name) {
            if (!util.strings.isBlank(name) && !util.strings.startWith(this._prefix)) {
                return this._prefix + name;
            }
            return name;
        },

        set: function(el, name, value) {
            if (el.length && !util.strings.isBlank(name) && typeof value !== 'undefined') {
                if (!util.strings.startWith(this._prefix)) {
                    name = this._prefix + name;
                }
                el.data(name, String(value));
            }
        },

        get: function(el, name) {
            if (el.length && !util.strings.isBlank(name)) {
                if (!util.strings.startWith(this._prefix)) {
                    name = this._prefix + name;
                }
                return el.data(name);
            }
        }
    }
};

$(document).ready(function() {
    app.baseInitializeContext();
    if (typeof app.initializeContext === 'function') {
        app.initializeContext();
    }
    app.initializeScreens();
    app.initializeView();

    util.timeIncrementProcessor.initialize();
    $('a:first').focus().blur();
});