var util = {
    typeaheadEngine: {
        compile: function(template) {
            var tpl = dust.compile(template, "tpl");
            dust.loadSource(tpl);

            return {
                render: function(context) {
                    var result;
                    dust.render("tpl", context, function(err, res) {
                        result = res;
                    });

                    return result;
                }
            }
        }
    },

    /* Dust templating features
    ------------------------------------------------------------------------------------------------------------------*/
    templating: {
        renderView: function(viewPath, data, onRenderHandler) {
            if (util.strings.isBlank(viewPath) || !onRenderHandler) {
                return false;
            }

            viewPath = viewPath.replace('.dust', '');
            // Unique id of the view that is used for keeping it in the Dust cache.
            var viewId = viewPath.replace(/.*views\//, '');
            while (viewId.indexOf('/') !== -1) {
                viewId = viewId.replace('/', '__');
            }

            var parseCompiledViewUri = function(viewPath) {
                return viewPath.replace(/.*views\//, '/js/dust/') + '.js';
            };

            // Path to already compiled view.
            var compiledViewUri = parseCompiledViewUri(viewPath);

            var renderCachedView = function() {
                dust.render(viewId, data, function(err, output) {
                    if (err) {
                        app.alerts.showErrorAlert(err.message);
                        return false;
                    } else {
                        output = app.initializeView(output);
                        onRenderHandler(output);
                    }
                });
            };

            var compileAndCacheView = function(path, id) {
                if (!dust.cache[id]) {
                    var templateUri = util.strings.endWith(path, '.dust') ? path : (path + '.dust')
                    app.ajaxAsync(null, app.constants.http.METHOD_GET, 'html', templateUri, null, function(partialContent) {
                        try {
                            var compiled = dust.compile(partialContent, id);
                            var partialFunc = eval(compiled);
                            dust.register(id, partialFunc);
                        } catch (err) {
                            app.log().error('Error compiling and registering dust template ' + templateUri + '\n', err);
                        }
                    });
                }
            };

            var registerNestedPartials = function(compiledPartialScript) {
                var partials = compiledPartialScript.match(/\.partial\(".+?"/g) || [];
                for (var i = 0; i < partials.length; i++) {
                    var partialPath = partials[i].replace(/\.partial\("/, '').replace(/"/, '');
                    if (dust.cache[partialPath]) {
                        continue;
                    }
                    var compiledPartialUri = parseCompiledViewUri(partialPath);
                    app.ajaxAsync(null, app.constants.http.METHOD_GET, 'script', compiledPartialUri, null, function(partialScript) {
                        try {
                            var partialFunc = eval(partialScript);
                            dust.register(partialPath, partialFunc);
                            registerNestedPartials(partialScript);
                        } catch (err) {
                            app.log().error('Error registering compiled dust template ' + compiledPartialUri + '\n', err);
                        }
                    }, function() {
                        var partialUri = /\/views\/.+/.exec(partialPath).pop();
                        compileAndCacheView(partialUri, partialPath);
                        if (dust.cache[partialPath]) {
                            registerNestedPartials(dust.cache[partialPath].toString());
                        }
                    });
                }
            };

            if (!dust.cache[viewId]) {
                // Load compiled view and execute it
                $.getScript(compiledViewUri)
                    .done(function(script) {
                        registerNestedPartials(script);
                        renderCachedView();
                    })
                    .fail(function() {
                        app.log().error('Error loading compiled dust template ' + compiledViewUri + '. Using client-side compilation.');
                        compileAndCacheView(viewPath, viewId);
                        if (dust.cache[viewId]) {
                            registerNestedPartials(dust.cache[viewId].toString());
                        }
                        renderCachedView();
                    });
            } else {
                renderCachedView();
            }
        }
    },

    /* HTML render utility methods
    ------------------------------------------------------------------------------------------------------------------*/
    html: {
        insertAfter: function(element, afterElement, callback) {
            if (!(element.length && afterElement.length))
                return;

            element
                .hide()
                .insertAfter(afterElement.last())
                .slideDown(app.constants.FADING_DURATION, callback);
        },

        insertInstead: function(replacer, source, callback, removeFirst) {
            if (!(source.length && replacer.length))
                return;

            replacer
                .css({
                    opacity: 0
                })
                .insertAfter(source.last())
                .animate({
                    opacity: 1
                }, app.constants.FADING_DURATION, function() {
                    if (removeFirst) source.remove();
                    if (callback) callback();
                });

            if (!removeFirst) source.remove();
        },

        appendTo: function(element, container, callback) {
            if (!(element.length && container.length))
                return;

            element
                .css({
                    opacity: 0
                })
                .appendTo(container)
                .animate({
                    opacity: 1
                }, app.constants.FADING_DURATION, callback);
        },

        prependTo: function(element, container, callback) {
            if (!(element.length && container.length))
                return;

            element
                .css({
                    opacity: 0
                })
                .prependTo(container)
                .animate({
                    opacity: 1
                }, app.constants.FADING_DURATION, callback);
        },

        slideIn: function(element, container, callback, direction) {
            if (!(element.length && container.length))
                return;

            element
                .hide()
                .appendTo(container);

            if (direction == 'right') {
                element.animate({
                    width: 'toggle'
                }, app.constants.FADING_DURATION, callback);
            } else
                element.animate({
                    height: 'toggle'
                }, app.constants.FADING_DURATION, callback);
        },

        isInputField: function(el) {
            return $(el).is('input, textarea');
        },

        setElValOrText: function(el, val) {
            util.html.isInputField(el) ? $(el).val(val) : $(el).text(val);
        },

        getElValOrText: function(el) {
            return util.html.isInputField(el) ? $(el).val() : $(el).text();
        },

        starify: function(elements) {
            $(elements).each(function(i, o) {
                var self = $(o);
                var prop = {
                    value: parseInt(self.attr('value')),
                    max: parseInt(self.attr('max')) || 5
                };

                prop.value = Math.min(prop.value, prop.max);

                var stars = '';
                var full = '<i class="glyphicon glyphicon-star"></i>';
                var empty = '<i class="glyphicon glyphicon-star-empty"></i>';

                for (var i = 0; i < prop.max; i++) {
                    stars += (i < prop.value) ? full : empty;
                }

                $(stars).appendTo(self);
            });
        },

        editable: function(elements, watermark, onEnterKeyHandler) {
            elements
                .addClass('form-control editable')
                .attr('contenteditable', true)
                .attr('data-placeholder', watermark)
                .attr('placeholder', watermark);

            if (onEnterKeyHandler)
                elements.bind('keydown', function(e) {
                    if (e.keyCode != app.constants.keyCode.ENTER) return true;
                    onEnterKeyHandler($(this));
                    return false;
                });
        },

        uneditable: function(elements) {
            elements
                .blur()
                .unbind('keydown')
                .removeAttr('contenteditable')
                .removeAttr('data-placeholder')
                .removeClass('form-control editable')
                .parent()
                .find('img.return-icon, div.tooltip')
                .remove();
        },

        photoUploader: {
            initialize: function(container) {
                if (!container) return;

                var fileInput = container.find('#photo-uploader:first');
                if (!fileInput.length) return false;

                var dragAndDropZone = container.find('.info-block .photo:first');
                if (!dragAndDropZone.length) return false;
                dragAndDropZone.find('a:first').click(function() {
                    fileInput.click();
                });

                util.forms.imageFilesUploader(fileInput, dragAndDropZone, function(e, data) {
                    app.alerts.showSuccessAlert('Test message: file successfully uploaded.')
                });
            }
        },

        // Validation rules are specified using HTML5 data attributes.
        buildValidationRules: function(field) {
            var rules = {};
            if (field.length) {
                var required = app.dataAttr.get(field, 'required');
                var type = app.dataAttr.get(field, 'type');
                var maxLength = app.dataAttr.get(field, 'maxlength');

                if (required !== undefined) {
                    rules.required = (required === true);
                }
                if (type !== undefined) {
                    rules[type] = true;
                }
                if (maxLength !== undefined) {
                    rules.maxlength = parseInt(maxLength);
                }
            }
            return rules;
        },

        editableFieldProcessor: function(field, valueChangeHandler) {
            field = $(field);
            if (!field.length) return false;

            var validationRules = this.buildValidationRules(field);
            var accessKey = 'tmp_init_val'; // is used for accessing to the initial value in the local storage

            field.focus(function() {
                // Store initial value
                var initialVal = util.html.getElValOrText(field);
                util.storage.setItem(accessKey, initialVal);
            });

            field.blur(function() {
                // Compare initial and current field values
                var initialVal = util.storage.getItem(accessKey) || '';
                var currentVal = util.html.getElValOrText(field);
                var validationStat = util.forms.validateField(field, validationRules);

                field.find('br').remove(); // special for webkit

                if (initialVal != currentVal && valueChangeHandler) {
                    if (!$.isEmptyObject(validationRules)) {
                        if (validationStat.valid) {
                            valueChangeHandler();
                        } else {
                            util.html.validationMessageProcessor(field, validationStat.message);
                            // TODO: Don't leave the field if it is not valid and don't use .focus()
                        }
                    } else {
                        valueChangeHandler();
                    }
                } else if (!validationStat.valid) {
                    util.html.validationMessageProcessor(field, validationStat.message);
                }
                util.storage.removeItem(accessKey);

                if (!(util.html.progressProcessor.inputs == null || util.html.progressProcessor.inputs.length == 0) &&
                    util.html.progressProcessor.inputs.has(field)) {

                    util.html.progressProcessor.update();
                }
            });

            var preventMultiLineEditing = field.hasClass('one-line-edit');
            field.keydown(function(e) {
                if (e.keyCode == app.constants.keyCode.ESC) {
                    // Restore initial value if 'ESC' has been pressed
                    var initialVal = util.storage.getItem(accessKey);
                    if (initialVal) {
                        util.html.setElValOrText(field, initialVal);
                    }
                    field.blur();
                } else if (preventMultiLineEditing && e.keyCode == app.constants.keyCode.ENTER) {
                    // Prevent multi line editing
                    field.blur();
                    return false;
                }
            });
        },

        validationMessageProcessor: function(field, message, messageElement, messageClass) {
            if (!field.length || field.attr('validating') !== undefined || util.strings.isBlank(message)) {
                return false;
            }

            field.find('br').remove(); // special for webkit

            // Build validation message on place it in required place.
            var messageEl = messageElement ? $("<" + messageElement + ">") : $("<span>");
            messageEl.addClass(messageClass || 'err-msg')
                .text(message)
                .css('display', 'none');


            // Output position of the validation message can be specified
            // by 'data-<prefix>-message-position' attribute set for the editable field.
            var messagePos = app.dataAttr.get(field, 'message-position') || 'bottom';
            switch (messagePos) {
                case 'before':
                    messageEl.insertBefore(field);
                    break;
                case 'after':
                    messageEl.insertAfter(field);
                    break;
                case 'bottom':
                    messageEl = $('<br/>' + messageEl[0].outerHTML);
                    messageEl.insertAfter(field);
                    break;
                default:
                    messageEl.insertAfter(field);
                    break;
            }

            // Validation message behaviour.
            var removeMessage = function() {
                messageEl.fadeOut(function() {
                    field.removeAttr('validating');
                    messageEl.remove();
                });
            };
            var validationRules = this.buildValidationRules(field);
            if (!$.isEmptyObject(validationRules)) {
                field.on('keyup', function() {
                    var validationStat = util.forms.validateField(field, validationRules);
                    if (validationStat.valid) {
                        field.off('keyup');
                        removeMessage();
                    }
                });
            } else {
                field.focus(removeMessage);
            }

            // Display validation message.
            messageEl.fadeIn(function() {
                field.attr('validating', true);
            });
        },

        mediaReplyProcessor: function(replyButtons, onReplyHandler, verb) {
            replyButtons.bind('click', function() {
                var self = $(this);
                self.hide();

                var data = {
                    verb: verb || 'reply',
                    user: app.userContext,
                    when: {
                        time: util.datetime.toServerTime(new Date()),
                        elapsed: 0
                    },
                    body: ""
                };

                util.templating.renderView('/views/shared/_media-replies-block', data, function(obj) {
                    var rendered = $(obj);
                    var quoteEditor = rendered.find('blockquote p:first');
                    quoteEditor.addClass('return-submit');
                    util.html.addReturnIcon(quoteEditor);

                    util.html.editable(quoteEditor, 'Enter your ' + data.verb, function(source) {
                        var finish = function() {
                            util.html.uneditable(source);
                            var timestamp = source.parents('.media-body:first').find('.timestamp:first');
                            timestamp.show();
                        };

                        if (onReplyHandler) {
                            if (onReplyHandler(source)) {
                                finish();
                            }
                        } else {
                            finish();
                        }
                    });
                    rendered.find('.timestamp').hide();
                    util.html.insertAfter(rendered, self);
                    quoteEditor.focus();

                    // cancel reply if 'ESC' key is pressed
                    quoteEditor.keydown(function(e) {
                        if (e.keyCode == app.constants.keyCode.ESC) {
                            rendered.remove();
                            self.fadeIn();
                        }
                    });
                });

                return false;
            });
        },

        progressProcessor: {
            progressBar: null,
            inputs: null,
            totalWeight: 0,
            percent: 0,
            initialize: function(view, progressBar) {
                if (!view || !progressBar) return;

                var self = this;
                view = $(view);

                var progWeightDataAttr = app.dataAttr.fullName('prog-weight');
                self.inputs = view.find('[' + progWeightDataAttr + ']').filter('input, span, textare');
                self.progressBar = progressBar;
                self.update();
            },
            update: function(source) {
                if (!this.inputs || this.inputs.length == 0) return 0;

                var self = this;
                var total = 0;
                var current = 0;
                self.inputs.each(function() {
                    var input = $(this);
                    var weight = parseInt(app.dataAttr.get(input, 'prog-weight'));

                    total += weight;

                    if (input.attr('validating')) return;
                    var value = util.html.getElValOrText(input);
                    if (!value || value.length == 0) return;

                    current += weight;
                });

                self.percent = Math.ceil(current / total * 100);
                self.totalWeight = total;
                self.progressBar.width(self.percent + '%');
                self.progressBar.find('span > b:first').html(self.percent + '%');
            }
        },

        addReturnIcon: function(elements) {
            $(elements).each(function() {
                var self = $(this);
                var item = $('<img src="' + app.settings.ASSETS_URL + '/imgs/return.png" title= "Press Return key to submit" data-placement="left" />');
                item
                    .addClass('return-icon')
                    .tooltip();

                if (!self.is('input'))
                    item.addClass('alt');

                self.after(item);
            });
        },

        time: function(containers) {
            var elapsedDataAttr = app.dataAttr.fullName('elapsed');
            containers.find('i.rel-time[' + elapsedDataAttr + ']').each(function() {
                var timeControl = $(this);
                timeControl.html(
                    util.datetime.getRelativeFriendlyTime(app.dataAttr.get(timeControl, 'elapsed'))
                );
                util.timeIncrementProcessor.register(timeControl);
            });

            var timeDataAttr = app.dataAttr.fullName('time');
            containers.find('i.abs-time[' + timeDataAttr + ']').each(function() {
                var timeControl = $(this);
                timeControl.html(
                    util.datetime.getFriendlyTime(app.dataAttr.get(timeControl, 'time'))
                );
            });
        },

        //any type of event or behavior that happens often and can be extracted
        initCustomElements: function(view) {
            //TABS: Only one tab at once [originall data-type="buttons" lets more than one selected]
            view.find(".nav-tabs[data-toggle='radio'] > a")
                .on("click", function() {
                    $(this).siblings(".active").removeClass('active');
                    $(this).addClass('active');
                });
        },

        avatar: function(view) {
            view.find('.avatar').each(function() {
                var avatar = $(this);
                var userId = app.dataAttr.get(avatar, 'user-id');
                var user = {};

                if (userId == 'me') {
                    user = app.userContext;
                } else {
                    user.gender = app.dataAttr.get(avatar, 'gender');
                    user.photo = app.dataAttr.get(avatar, 'photo');
                    user.name = app.dataAttr.get(avatar, 'name');
                }

                user.gender = user.gender || 'male';
                user.photo = user.photo || '/imgs/' + user.gender + '.png'

                if (user.photo[0] == '/')
                    user.photo = app.settings.ASSETS_URL + user.photo;

                var img = $('<img src="' + user.photo + '" class="media-object" alt="' + user.name + '" />');
                img.appendTo(avatar);
                avatar.attr('title', user.name);
            });
        },

        calendar: function(view) {
            var calendar = view.find('.oc-calendar:first');

            var WEEKDAY_SHORT_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            var now = new Date();

            var calculateOffset = function() {
                var day = now.getDay();
                if (day == 0) day = 7;

                var date = now.getDate();
                var daysInAWeek = 7

                var dayOfWeek = Math.round(((date / daysInAWeek) - (Math.floor(date / daysInAWeek))) * daysInAWeek);

                return day - dayOfWeek;
            };

            var offset = calculateOffset();

            calendar.each(function() {
                var month = $(util.strings.format('<div class="month">{month} {year}</div>', {
                    month: app.constants.longMonth[now.getMonth()],
                    year: now.getFullYear()
                }));
                month.appendTo(calendar);

                var names = $('<div class="names"></div>');
                names.appendTo(calendar);

                for (var i = 0; i < WEEKDAY_SHORT_NAMES.length; i++) {
                    var name = $("<div>" + WEEKDAY_SHORT_NAMES[i] + "</div>");
                    name.appendTo(names);
                }

                var days = $('<div class="days"></div>');
                days.appendTo(calendar);

                for (var i = 1; i <= 31; i++) {
                    var day = $("<div>" + i + "</div>");
                    day.appendTo(days);
                }

                for (var i = 0; i < offset; i++) {
                    var lastMonthDay = $("<span>-</span>");
                    lastMonthDay.prependTo(days);
                }
            });
        }
    },

    scrollSpy: function(container, target, offset) {
        var scrollContainer = container === document ? $('html,body') : $(container);

        if (!container) return;
        if (!target) target = $(container).find('.scroll-spy-target:first');
        if (target.length == 0) return;

        var trackedElements = [];
        var selectors = target.find('li>a');
        offset = offset || 0;

        var handleScroll = function(ele) {
            ele.selector.click(function() {
                scrollContainer.animate({
                    scrollTop: ele.top + 50
                });
                return false;
            });
        };

        for (var i = 0; i < selectors.length; i++) {
            var trackedElement = $(container).find($(selectors[i]).attr('href'));
            if (trackedElement.length == 0) continue;

            var element = {
                selector: $(selectors[i]).parents('li:first'),
                top: trackedElement.offset().top + offset
            };

            element.bottom = element.top + trackedElement.height();
            handleScroll(element);

            trackedElements.push(element);
        }

        if (trackedElements.length == 0) return;
        $(container).scroll(function() {
            var scrollTop = $(this).scrollTop();
            for (var i = 0; i < trackedElements.length; i++) {
                if (scrollTop >= trackedElements[i].top && scrollTop <= trackedElements[i].bottom) {
                    if (!trackedElements[i].selector.hasClass('selected')) {
                        target.find('.selected:first').removeClass('selected');
                        trackedElements[i].selector.addClass('selected');
                    }
                    return;
                }
            }
        });
    },

    /* 
        will auto increment relative time labels
        TODO: possible improvements include moving different time units into seperate intervals.
        */
    timeIncrementProcessor: {
        interval: null,
        comps: [],

        initialize: function() {
            var self = this;
            self.interval = setInterval(function() {
                self.onUpdateTime(self);
            }, app.constants.timeIncrementProcessor.UPDATE_INTERVAL);
        },

        register: function(timeControl) {
            var elapsed = app.dataAttr.get(timeControl, 'elapsed');
            if (Math.abs(elapsed) > app.constants.timeIncrementProcessor.MAX_ELAPSED_AUTO_INCREMENT) return;

            var localTs = util.datetime.addSeconds(new Date(), elapsed * -1);
            this.comps.push({
                ctrl: timeControl,
                ts: localTs
            });
        },

        unregister: function(i) {
            this.comps.splice(i, 1);
        },

        onUpdateTime: function(processor) {
            for (var i = processor.comps.length - 1; i >= 0; i--) {
                var comp = processor.comps[i];
                // make sure the control is still on the page, if not remove it from being processed
                if (comp.ctrl.closest(document.documentElement).length == 0) {
                    processor.unregister(i);
                    continue;
                }

                var newElapsed = util.datetime.diffSeconds(comp.ts, new Date());
                app.dataAttr.set(comp.ctrl, 'elapsed', newElapsed);
                comp.ctrl.html(util.datetime.getRelativeFriendlyTime(newElapsed));
            }
        }
    },

    strings: {
        format: function(str, merge) {
            if (!str || !merge) return;

            for (var key in merge) {
                var rgx = new RegExp('{' + key + '}', 'gi');
                if (!merge.hasOwnProperty(key)) continue;
                str = str.replace(rgx, merge[key]);
            }

            return str;
        },

        startWith: function(str, prefix) {
            return str.slice(0, str.length) === prefix;
        },

        endWith: function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        },

        escape: function(str) {
            return str
                .replace(/[\\]/g, '\\\\')
                .replace(/[\"]/g, '\\\"')
                .replace(/[\/]/g, '\\/')
                .replace(/[\b]/g, '\\b')
                .replace(/[\f]/g, '\\f')
                .replace(/[\n]/g, '\\n')
                .replace(/[\r]/g, '\\r')
                .replace(/[\t]/g, '\\t');
        },

        isBlank: function(str) {
            return (!str || /^\s*$/.test(str));
        }
    },

    /* HTTP utility methods
    ------------------------------------------------------------------------------------------------------------------*/
    http: {
        getRequestParamByName: function(paramName) {
            if (!paramName) return undefined;

            paramName = paramName.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var paramRegex = new RegExp("[\\?&]" + paramName + "=([^&#]*)");
            var results = paramRegex.exec(location.search);
            return results == null ? undefined : decodeURIComponent(results[1].replace(/\+/g, " "));
        },

        redirectTo: function(path) {
            window.location.href = path;
        },

        getPath: function() {
            return window.location.pathname.toLowerCase();
        }
    },


    /* Forms utility methods
    ----------------------------------------------------------------------------------------------------------------------*/
    forms: {
        validate: function(form, rules, submitHandler) {
            form = $(form);
            if (form.length) {
                form.validate({
                    submitHandler: function(validForm) {
                        if (submitHandler) {
                            submitHandler(validForm);
                        } else {
                            validForm.submit();
                        }
                    },
                    rules: rules,
                    errorElement: 'label',
                    errorClass: 'err-msg form-err-msg'
                });
            }
        },

        /**
         * Validates the specified field with the given validation rules.
         *
         * @return json object like {valid: true|false, message: string}, where:
         *         valid   - flag that describes validation state of the field (valid=true or invalid=false)
         *         message - information about results of validation. In current moment it provides information about error when field is invalid.
         */
        validateField: function(field, validationRules) {
            var fieldVal = util.html.getElValOrText(field);
            // Create virtual form to validate field value with the given rules.
            var virtualForm = $("<form><input id='validationInput' type='text' name='validationInput' value='" + fieldVal + "'></form>");
            var formValidator = virtualForm.validate({
                rules: {
                    validationInput: validationRules
                }
            });
            // Launch field validation. Results of validation are saved into the formValidator.
            var fieldValid = formValidator.element(virtualForm.find('#validationInput'));

            // Build result of field validation.
            var fieldValidationStat = {
                valid: fieldValid,
                message: fieldValid ? '' : formValidator.errorMap.validationInput
            };

            virtualForm.remove();
            return fieldValidationStat;
        },

        findSubmits: function(context) {
            var foundSubmits = [];
            var ctx = $(context);
            if (ctx.length) {
                if (ctx.is("*[type='submit']")) {
                    foundSubmits.push(ctx[0]);
                } else {
                    foundSubmits = ctx.find("*[type='submit']");
                }
            }
            return $(foundSubmits);
        },

        imageFilesUploader: function(fileInput, dragAndDropZone, uploadedHandler) {
            var fTypeRestrict = app.constants.regexp.ACCEPTABLE_IMAGES;
            var fSizeRestrict = 20000000; // 20mb

            // To get more information about jQuery upload plugin see:
            // https://github.com/blueimp/jQuery-File-Upload/wiki/Options
            fileInput.fileupload({
                type: app.constants.http.METHOD_POST,
                dataType: 'json',
                dropZone: dragAndDropZone,
                pasteZone: dragAndDropZone,
                singleFileUploads: false,
                limitMultiFileUploads: 5,
                sequentialUploads: true,
                forceIframeTransport: (window.XMLHttpRequest === undefined),
                autoUpload: true,
                acceptFileTypes: fTypeRestrict,
                maxFileSize: fSizeRestrict,
                add: function(e, data) {
                    if (data.files.length) {
                        var initialFilesN = data.files.length;
                        // Find and remove invalid files
                        var invalidFiles = filterInvalidFiles(data.files);
                        for (var i = 0; i < invalidFiles.length; i++) {
                            var index = jQuery.inArray(invalidFiles[i], data.files);
                            data.files.splice(index, 1);
                        }

                        if (invalidFiles.length > 0) {
                            if (invalidFiles.length === initialFilesN) {
                                app.alerts.showWarningAlert("We can't upload selected files. Check that you are trying to upload images.");
                            } else {
                                app.alerts.showWarningAlert("Some of selected files can't be uploaded. Check that you are trying to upload only images.");
                            }
                        }
                    }
                    data.submit();
                },
                done: function(e, data) {
                    var apiResponseJSON = data.jqXHR.responseJSON;
                    if (uploadedHandler && apiResponseJSON) {
                        uploadedHandler(apiResponseJSON);
                    }
                },
                fail: function(e, data) {
                    app.alerts.showErrorAlert(data.errorThrown, data.textStatus);
                }
            }).prop('disabled', !$.support.fileInput);

            var filterInvalidFiles = function(files) {
                var invalidFiles = [];
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];

                    // Check file type
                    var fType = null;
                    if (file.type) {
                        if (file.type.indexOf('image/') !== -1) {
                            fType = file.type.replace('image/', '');
                        }
                    } else {
                        if (file.name.indexOf('.') !== -1) {
                            fType = file.name.split('.').pop();
                        }
                    }
                    if (!fType || !fTypeRestrict.test(fType)) {
                        invalidFiles.push(file);
                        continue;
                    }

                    // Check file size
                    if (file.size && (file.size > fSizeRestrict || file.size == 0)) {
                        invalidFiles.push(file);
                    }
                }
                return invalidFiles;
            };

            var isDragAndDropSupports = function() {
                return 'draggable' in document.createElement('span');
            };

            if (dragAndDropZone && dragAndDropZone.length && isDragAndDropSupports()) {
                var dragOverClassname = 'dragover';
                dragAndDropZone.on({
                    dragover: function() {
                        dragAndDropZone.addClass(dragOverClassname);
                    },
                    dragleave: function() {
                        dragAndDropZone.removeClass(dragOverClassname);
                    },
                    drop: function() {
                        dragAndDropZone.removeClass(dragOverClassname);
                    }
                });
            }
        },

        extendValidationRules: function() {
            // Web address validation.
            $.validator.addMethod('webaddress', function(value, element) {
                return this.optional(element) || app.constants.regexp.WEB_ADDRESS.test(value);
            }, 'Please enter a valid web address.');

            // Phone validation.
            $.validator.addMethod('phone', function(value, element) {
                return this.optional(element) || app.constants.regexp.PHONE_NUMBER.test(value);
            }, 'Please enter a valid phone number.');

            // Time validation (ex 03:15 PM).
            $.validator.addMethod('time12', function(value, element) {
                return this.optional(element) || app.constants.regexp.TIME_12.test(value);
            }, 'Please enter a valid time.');
        },

        serializeFormDataAsObject: function(form) {
            var formDataObj = {};
            form = $(form);
            if (!form.length) {
                return formDataObj;
            }
            var formDataArr = form.serializeArray();
            $.each(formDataArr, function() {
                if (formDataObj[this.name] !== undefined) {
                    if (!formDataObj[this.name].push) {
                        formDataObj[this.name] = [formDataObj[this.name]];
                    }
                    formDataObj[this.name].push(this.value || '');
                } else {
                    formDataObj[this.name] = this.value || '';
                }
            });
            return formDataObj;
        }
    },

    /* HTML 5 local storage
    ----------------------------------------------------------------------------------------------------------------------*/
    storage: {
        supports: function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },

        getItem: function(itemKey) {
            if (!util.storage.supports()) {
                return undefined;
            }
            return localStorage.getItem(itemKey);
        },

        setItem: function(itemKey, itemValue) {
            if (!util.storage.supports()) {
                return false;
            }
            localStorage.setItem(itemKey, itemValue);
            return true;
        },

        removeItem: function(itemKey) {
            if (!util.storage.supports()) {
                return false;
            }
            localStorage.removeItem(itemKey);
            return true;
        }
    },

    dimension: {
        xs: function() {
            return !$('#mobile-test:first').is(':hidden');
        },

        desktop: function() {
            return !$('#desktop-test:first').is(':hidden');
        }
    },

    gps: {
        get: function(callback, fail) {
            if (!callback) return;

            var options = {
                enableHighAccuracy: true,
                timeout: app.constants.ALERT_TIMEOUT * 2,
                maximumAge: 0
            };

            var success = function(pos) {
                var crd = pos.coords || pos;
                return callback(crd);
            };

            var error = function(err) {
                app.alerts.showErrorAlert(err.message, err.code);
                if (fail) fail(err);
            };

            navigator.geolocation.getCurrentPosition(success, error, options);
        }
    },

    /* Datetime utility methods
    ------------------------------------------------------------------------------------------------------------------*/
    datetime: {
        now: function() {
            return new Date();
        },

        today: function() {
            var now = this.now();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        },

        diffSeconds: function(d1, d2) {
            var t2 = d2.getTime();
            var t1 = d1.getTime();
            return parseInt((t2 - t1) / 1000);
        },

        addSeconds: function(date, seconds) {
            return new Date(date.getTime() + seconds * 1000);
        },

        toServerTime: function(time) {
            if (!(time instanceof Date)) {
                return null;
            }

            var day = time.getDate(),
                month = time.getMonth() + 1,
                year = time.getFullYear(),
                hour = time.getHours(),
                min = time.getMinutes(),
                sec = time.getSeconds();

            return month + '.' + day + '.' + year + ' ' + hour + ':' + min + ':' + sec;
        },

        toDate: function(time) {
            if (time instanceof Date)
                return time;

            var dateTime;
            var parts = time.split(' ');
            var datePart = parts[0].split('.');

            if (parts.length == 1) {
                dateTime = new Date(parseInt(datePart[2]), parseInt(datePart[0]) - 1, parseInt(datePart[1]));
            }
            if (parts.length == 2) {
                var timePart = parts[1].split(':');
                dateTime = new Date(parseInt(datePart[2]), parseInt(datePart[0]) - 1, parseInt(datePart[1]),
                    parseInt(timePart[0]), parseInt(timePart[1]), parseInt(timePart[2]));
            }

            return dateTime;
        },

        getFriendlyTime: function(time) {
            time = this.toDate(time);

            var day = time.getDate(),
                month = time.getMonth(),
                year = time.getFullYear(),
                hour = time.getHours(),
                min = time.getMinutes(),
                sec = time.getSeconds();

            var formated = app.constants.shortMonth[month] + ' ' + day + ', ' + year;
            if (!(hour == 0 && min == 0 && sec == 0)) {
                formated += ' ';
                var AMPM;
                if (hour < 12) {
                    AMPM = 'AM';
                } else {
                    AMPM = 'PM';
                    hour -= 12;
                }

                formated += hour;
                if (sec > 0 || min > 0) {
                    formated += ':' + min;
                    if (sec > 0)
                        formated += ':' + sec;
                }

                formated += ' ' + AMPM;
            }

            return formated;
        },

        getRelativeFriendlyTime: function(elapsed) {
            if (elapsed == null) return '';
            if (elapsed == 0) return 'now';

            var unit = '';
            var amount = 0;
            var past = elapsed > 0;
            elapsed = Math.abs(elapsed);

            if (elapsed < app.constants.interval.MINUTE) {
                unit = 'sec';
                amount = elapsed;
            } else if (elapsed < app.constants.interval.HOUR) {
                unit = 'min';
                amount = elapsed / app.constants.interval.MINUTE;
            } else if (elapsed < app.constants.interval.DAY) {
                unit = 'hour';
                amount = elapsed / app.constants.interval.HOUR;
            } else if (elapsed < app.constants.interval.WEEK) {
                unit = 'day';
                amount = elapsed / app.constants.interval.DAY;
            } else if (elapsed < app.constants.interval.MONTH) {
                unit = 'week';
                amount = elapsed / app.constants.interval.WEEK;
            } else if (elapsed < app.constants.interval.YEAR) {
                unit = 'month';
                amount = elapsed / app.constants.interval.month;
            } else {
                unit = 'year';
                amount = elapsed / app.constants.interval.YEAR;
            }

            unit += amount == 1 ? '' : 's';
            amount = Math.ceil(amount);

            if (past)
                return amount + ' ' + unit + ' ago';
            else
                return 'in ' + amount + ' ' + unit;
        },

        format: function(date, sep) {
            if (!date) date = this.now();
            if (!sep) sep = '/';

            var dd = date.getDate();
            var mm = date.getMonth() + 1; //January is 0!

            var yyyy = date.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }

            return mm + sep + dd + sep + yyyy;
        }
    }
};

(function() {
    util.forms.extendValidationRules();
})();