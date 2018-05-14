'use strict';

var kwSequencer = {

    actionFilePath: "",
    drivers: false,

    init: function(){
        var $currentPage = katana.$activeTab;
        var $newBtn = $currentPage.find('[katana-click="kwSequencer.newKeyword"]');
        var $closeBtn = $currentPage.find('[katana-click="kwSequencer.closeKeyword"]');
        var $saveBtn = $currentPage.find('[katana-click="kwSequencer.saveKeyword"]');
        var $displayFilesDiv = $currentPage.find('#display-files');
        var $displayErrorMsgDiv = $currentPage.find('#display-error-message');
        var $createKwDiv = $currentPage.find('#create-keyword');
        kwSequencer.actionFilePath = "";
        $newBtn.hide();
        $closeBtn.hide();
        $saveBtn.hide();
        $createKwDiv.hide();
        $.ajax({
            type: 'GET',
            url: 'read_config_file/',
        }).done(function(config_json_data) {
            if(config_json_data["pythonsrcdir"] === ""){
                $displayErrorMsgDiv.show();
                $displayFilesDiv.hide();
            } else {
                $newBtn.show();
                $displayErrorMsgDiv.hide();
                $displayFilesDiv.show();
                $.ajax({
                    headers: {
                        'X-CSRFToken': $currentPage.find('input[name="csrfmiddlewaretoken"]').attr('value')
                    },
                    type: 'POST',
                    url: 'get_file_explorer_data/',
                    // TODO: Find a correct way to append '/Actions'
                    data: {"data": {"start_dir": config_json_data["pythonsrcdir"]+'/Actions'}}
                }).done(function(data) {
                    // TODO: Do not show __init__.py files
                    $displayFilesDiv.jstree({
                        "core": { "data": [data]},
                        "plugins": ["search", "sort"],
                        "sort": function (a, b) {
                            var nodeA = this.get_node(a);
                            var nodeB = this.get_node(b);
                            var lengthA = nodeA.children.length;
                            var lengthB = nodeB.children.length;
                            if ((lengthA == 0 && lengthB == 0) || (lengthA > 0 && lengthB > 0))
                                return this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1;
                            else
                                return lengthA > lengthB ? -1 : 1;
                        }
                    });
                    $displayFilesDiv.jstree().hide_dots();
                    $displayFilesDiv.on('changed.jstree', function (e, data) {
                        kwSequencer.actionFilePath = data.instance.get_path(data.node, '/');
                    });
                });
            }
        });
    },

    newKeyword: function(){
        var isActionFile = false;
        if (kwSequencer.actionFilePath) {
            var actionFileName = kwSequencer.actionFilePath.split('\\').pop().split('/').pop();
            var actionFileExtn = actionFileName.split('.').pop();
            if (actionFileName != '__init__.py' && actionFileExtn == 'py') {
                isActionFile = true;
            }
        }

        if (isActionFile) {
            $.ajax({
               type: 'GET',
               url: 'kw_sequencer/create_new_kw/'
            }).done(function(data){
                var $currentPage = katana.$activeTab;
                var $newBtn = $currentPage.find('[katana-click="kwSequencer.newKeyword"]');
                var $closeBtn = $currentPage.find('[katana-click="kwSequencer.closeKeyword"]');
                var $saveBtn = $currentPage.find('[katana-click="kwSequencer.saveKeyword"]');
                var $displayFilesDiv = $currentPage.find('#display-files');
                var $displayErrorMsgDiv = $currentPage.find('#display-error-message');
                var $createKwDiv = $currentPage.find('#create-keyword');
                var $toolBarDiv = $currentPage.find('.tool-bar');
                $newBtn.hide();
                $closeBtn.show();
                $saveBtn.show();
                $displayFilesDiv.hide();
                $displayErrorMsgDiv.hide();
                $createKwDiv.show();
                $createKwDiv.html(data);
                $currentPage.find("#wrapperActionFile").val(actionFileName.split('.')[0]);
                $toolBarDiv.find('.title').html("Katana Wrapper Keyword Editor");
            });
        } else {
            katana.openAlert({"alert_type": "warning",
                               "heading": "Action file required!",
                               "text": "Please choose a Warrior Action File and click 'New' to create a Keyword.",
                               "accept_btn_text": "Ok", "show_cancel_btn": false})
        }

    },

    closeKeyword: function(){
        var $currentPage = katana.$activeTab;
        var callbackOnAccept = function(){
            $currentPage.find('[katana-click="kwSequencer.newKeyword"]').show();
            $currentPage.find('[katana-click="kwSequencer.closeKeyword"]').hide();
            $currentPage.find('[katana-click="kwSequencer.saveKeyword"]').hide();
            $currentPage.find('#create-keyword').hide();
            $currentPage.find('#display-files').show();
            var $toolBarDiv = $currentPage.find('.tool-bar');
            $toolBarDiv.find('.title').html("Create New Keyword");
        }
        katana.openAlert({"alert_type": "warning",
                           "heading": "Do You Want To Continue?",
                           "text": "All changes made would be discarded.",
                           "accept_btn_text": "Yes", "cancel_btn_text": "No"},
                           callbackOnAccept)

    },

    newSubKeyword: function(){
        $.ajax({
            type: 'GET',
            url: 'kw_sequencer/create_new_subkw/'
        }).done(function(data) {
            var $currentPage = katana.$activeTab;
            var $newSubKwDiv = $currentPage.find('#new-sub-keyword-div');
            $newSubKwDiv.html(data.html_data);
            $newSubKwDiv.show();
            kwSequencer.drivers = data.drivers;
        });
    },

    cancelSubKeyword: function(){
        var $currentPage = katana.$activeTab;
        $currentPage.find('#new-sub-keyword-div').hide();
    },

    saveSubKeyword: function(){
        var $currentPage = katana.$activeTab;
        var $newSubKwDiv = $currentPage.find('#new-sub-keyword-div');
        if (katana.validationAPI.init($newSubKwDiv)){
            var data = kwSequencer.generateSubKwJson($newSubKwDiv);
        }
    },

    generateSubKwJson: function($container){
        var finalJson = {SubKws: { subKw: []}};
        var $allSubKws = $container.attr('key') === 'subKw'? [$container] : $container.find('[key="subKw"]');
        var $allKeys = false;
        var partialData = false;
        for (var i=0; i <$allSubKws.length; i++) {
            $allKeys = $($allSubKws[i]).find('[key]').not('[key*="Arguments"]');
            partialData = {};
            for (var j=0; j<$allKeys.length; j++) {
                var key = $($allKeys[j]).attr("key").trim();
                var value = $($allKeys[j]).val() ? $($allKeys[j]).val().trim() : $($allKeys[j]).html().trim();
                $.extend(true, partialData, kwSequencer._updateJson(key, value));
            }
            $.extend(true, partialData, kwSequencer.generateArguments($($allSubKws[i]).find('[key="Arguments.argument"]')));
            finalJson.SubKws.subKw.push(partialData);
        }
        return finalJson
    },

    generateArguments: function ($container){
        /* This function creates arguments json out of an HTML block. Typically this function should
        never be called independently. */
        var finalJson = {Arguments: {argument: []}};
        var partialData = false;
        var $argBlock = false;
        for (var i=0; i<$container.length; i++) {
            $argBlock = $($container[i]).find('[key]');
            partialData = {};
            for (var j=0; j<$argBlock.length; j++) {
                var key = $($argBlock[j]).attr("key").trim();
                var val = $($argBlock[j]).val() ? $($argBlock[j]).val().trim() : $($argBlock[j]).attr('value');
                var value = val ? val.trim() : $($argBlock[j]).html().trim();
                $.extend(true, partialData, kwSequencer._updateJson(key, value));
            }
            finalJson.Arguments.argument.push(Object.assign({}, partialData.Arguments.argument));
        }
        return finalJson;
    },

    _updateJson: function (unrefined_key, value) {
        /* This function iterates through a json recursively and inserts the value for the given key at the correct place.
         * This function should never be called independently */
        var data = {};
        var key = unrefined_key.split(/\.(.+)/)[0];
        var remaining_key = unrefined_key.split(/\.(.+)/)[1];
        if (key !== undefined && remaining_key !== undefined) {
            data[key] = kwSequencer._updateJson(remaining_key, value)
        } else {
            data[unrefined_key] = value;
        }
        return data;
    },

    getDriverKeywords: function(){
        $elem = $(this);
        var driverName = $elem.val();
        var $kwRow = $elem.closest('.row').next();
        $kwRow.find('#stepKeyword').html("<option selected disabled hidden>Select Keyword</option>");
        if ((kwSequencer.drivers) && (driverName in kwSequencer.drivers)) {
            for (var key in kwSequencer.drivers[driverName].actions){
                if (kwSequencer.drivers[driverName].actions.hasOwnProperty(key)){
                    $kwRow.find('#stepKeyword').append('<option>' + key + '</option>');
                }
            }
        }
        // To reset Siganture/Arguemnts/wDescription/Comments blocks
        kwSequencer.getArgumentsEtc($kwRow.find('label'));
    },

    getArgumentsEtc: function($elem){
        /* This function internally calls the _setSignature, _setArguments, _setWDescription, _setComments
        functions for upadting those fields on kw name change */
        $elem = $elem ? $elem : $(this);
        var kwName = $elem.val();
        var driverName = $elem.closest('.row').prev().find('#stepDriver').val();
        var data = false;

        if ((kwSequencer.drivers) && (driverName in kwSequencer.drivers)) {
            if (kwName in kwSequencer.drivers[driverName].actions) {
                data = kwSequencer.drivers[driverName].actions[kwName]
            }
        }
        kwSequencer._setSignature($elem.closest('.row').next(), data);
        kwSequencer._setArguments($elem.closest('.row').next().next(), data);
        kwSequencer._setWDescription($elem.closest('.row').next().next().next(), data);
        kwSequencer._setComments($elem.closest('.row').next().next().next().next(), data);
    },

    _setSignature: function ($topLevelSignRow, data) {
        /* This function hides/shows corresponding function signature */
        $topLevelSignRow.hide();
        if (data) {
            $topLevelSignRow.find('textarea').html(data.signature);
            $topLevelSignRow.show();
        }
    },

    _setArguments: function ($topLevelArgRow, data) {
        /* This function hides/shows corresponding arguments */
        var $argRow = $topLevelArgRow.find('#arg-template').attr('key', 'Arguments.argument').clone().show();
        var $argContainer = $topLevelArgRow.find('.container-fluid');
        //$topLevelArgRow.find('#arg-template').remove();
        $argContainer.children().slice(1).remove();
        $topLevelArgRow.hide();
        var temp = false;

        if (data) {
            for (var i=0; i<data.arguments.length; i++){
                temp = $argRow.clone();
                temp.find('.subkw-label').attr('for', data.arguments[i]);
                temp.find('.subkw-label').html(data.arguments[i]);
                temp.find('.subkw-text').find('input').attr('id', data.arguments[i]);
                $argContainer.append(temp.clone());
                $topLevelArgRow.show();
            }
        }
    },

    _setWDescription: function ($topLevelWDescRow, data) {
        /* This function hides/shows corresponding description */
        $topLevelWDescRow.hide();
        if (data) {
            $topLevelWDescRow.find('textarea').html(data.wdesc);
            $topLevelWDescRow.show();
        }
    },

    _setComments: function ($topLevelCommentsRow, data) {
        /* This function hides/shows corresponding comments */
        $topLevelCommentsRow.hide();
        if (data) {
            $topLevelCommentsRow.find('textarea').html(data.comments);
            $topLevelCommentsRow.show();
        }
    },

};
