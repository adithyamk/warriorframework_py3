

var jsonSuiteObject = [];
var jsonTestCases=[];


function mapFullSuiteJson(myobject) {
	jsonSuiteObject = myobject; 
	jsonTestCases = jsonSuiteObject['Testcases'];
	mapSuiteJsonToUi(jsonTestCases);
}


function addCaseToSuite(){
	// 
	// Add an entry to the jsonTestSuites....
	// The UI is updated after the case is appended to the master 
	// list of cases. 
	//
	var newTestCase = {	
		"path": "../suites/framework_tests/seq_par_execution/seq_ts_seq_tc.xml", 
		"context" : "positive",
		"run_type": "sequential_keywords",
		"retry": {"@type": "if not", "@Condition": "testsuite_1_result", "@Condvalue": "PASS", "@count": "6", "@interval": "0"}, 
		"onError": { "@action": "next", "@value": "" }, 
		"impact": "impact" };
	// The javascript json feauture where an array of 1 is really the object itself
	if (!jQuery.isArray(jsonTestCases['Testcase'])) {
		jsonTestCases['Testcase'] = [jsonTestCases['Testcase']];
		}

	jsonTestCases['Testcase'].push(newTestCase);
	mapSuiteJsonToUi(jsonTestCases);
}

function mapUiToSuiteJson() {
	
	jsonSuiteObject['Details']['Name']['$'] = $('#suiteName').val();
	jsonSuiteObject['Details']['Title']['$'] = $('#suiteTitle').val();
	jsonSuiteObject['Details']['Engineer']['$'] = $('#suiteEngineer').val();
	jsonSuiteObject['Details']['Title']['$'] = $('#suiteTitle').val();
	jsonSuiteObject['Details']['Date']['$'] = $('#suiteDate').val();
	//jsonSuiteObject['Details']['Time'] = $('#suiteTime').val();
	jsonSuiteObject['Details']['default_onError']['$'] = $('#default_onError').val();
	jsonSuiteObject['Details']['Datatype']['$'] = $('#suiteDatatype').val();
	jsonSuiteObject['ResultsDir'] = { "$" : $('#suiteResults').val()};
	

	jsonSuiteObject['SaveToFile'] = { "$" : $('#my_file_to_save').val()};
	// Now walk the DOM ..

	var xdata = jsonSuiteObject['Testsuites']['Testsuite'];
	for (var s=0; s<Object.keys(xdata).length; s++ ) {
		var oneCase = xdata[s];

		id = '#'+s+"-path";
		oneCase['path']={};
		oneCase['path']['$'] = $(id).val();
		id = '#'+s+"-context";
		oneCase['context']={};
		oneCase['context']['$'] = $(id).val();
		id = '#'+s+"-runtype";
		oneCase['runtype']={};
		oneCase['runtype']['$'] = $(id).val();

		oneCase['onError']={};
		oneCase['onError']['$'] = "";
		id = '#'+s+"-onError-at-action";
		oneCase['onError']['@action'] = $(id).val();
		id = '#'+s+"-onError-at-value option:selected";
		oneCase['onError']['@value'] = $(id).val();

		oneCase['Execute']={"$":"", '@ExecType': {} };
		id = '#'+s+"-Execute-at-ExecType";
		oneCase['Execute']['@ExecType']['$'] = ""; 

		id = '#'+s+"-Execute-Rule-at-Condition";
		oneCase['Execute']['Rule']['@Condition'] = $(id).val();
		id = '#'+s+"-Execute-Rule-at-Condvalue";
		oneCase['Execute']['Rule']['@Condvalue'] = $(id).val();
		id = '#'+s+"-Execute-Rule-at-Else";
		oneCase['Execute']['Rule']['@Else'] = $(id).val();
		id = '#'+s+"-Execute-Rule-at-Elsevalue";
		oneCase['Execute']['Rule']['@Elsevalue'] = $(id).val();

		oneCase['retry'] = {}
		oneCase['retry']['$'] = "";
		id = '#'+s+"-retry-at-type";
		oneCase['retry']['@type'] = $(id).val();
		id = '#'+s+"-retryat-Condition";
		oneCase['retry']['@Condition'] = $(id).val();
		id = '#'+s+"-retry-at-Condvalue";
		oneCase['retry']['@Condvalue'] = $(id).val();
		id = '#'+s+"-retry-at-count";
		oneCase['retry']['@count'] = $(id).val();
		id = '#'+s+"-retry-at-interval";
		oneSuite['retry']['@interval'] = $(id).val();
		id = '#'+s+"-runtype";
		oneCase['runtype']['$'] = $(id).val();


	}
	// Now you have collected the user components...

	var url = "../getSuiteDataBack";
	var csrftoken = $("[name='csrfmiddlewaretoken']").val();

	$.ajaxSetup({
			function(xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken)
    	}
	});

	var topNode  = { 'TestSuites' : jsonSuiteObject};
	var jj = new json() ; 
	// var mystring =  JSON.stringify(jsonSuiteObject);
	var ns = jj.translate.toXML(topNode);

	//alert(ns);

	$.ajax({
    url : url,
    type: "POST",
    data : { 
    	'json': JSON.stringify(topNode),
    	'Suite': ns,
    	'filetosave': $('#my_file_to_save').val()
    	},
    headers: {'X-CSRFToken':csrftoken},
    //contentType: 'application/json',
    success: function( data ){
        alert("Sent");
    	}
	});

}

function mapSuiteJsonToUi(data){	//
	// Maps one JSON TestSuites object to UI 
	// jQuery UI elements are created on the master interfce 
	//
	var items = []; 
	var xdata = data['Testcase'];
	if (!jQuery.isArray(xdata)) xdata = [xdata];
	items.push('<div id="accordion_display" class="col-md-12">');	
	//console.log("data=" + data);
	//console.log("xdata =" + xdata);
	$("#listOfTestCasesForSuite").html("");
	console.log("Drawing test cases "+Object.keys(xdata).length);
	for (var s=0; s<Object.keys(xdata).length; s++ ) {
		var oneCase = xdata[s];
		//console.log(oneCase['path']);
		items.push('<div class="collapse">');
		items.push('<h3>TestCase '+s+"</h3>");
		items.push('<label class="col-md-2 text-right" for="defaultOnError>'+oneCase['path']['$']+'</label><br>');
		// -------------------------------------------------------------------------
		// Validation and default assignments 
		// Create empty elements with defaults if none found. ;-)
		// -------------------------------------------------------------------------
		if (! oneCase['path']){
			oneCase['path'] = {'$': ""}; 
		}
		if (! oneCase['context']){
			oneCase['context'] = {'$':"positive"}; 
		}
		if (! oneCase['runtype']){
			oneCase['runtype'] = {'$': "sequential_keywords"}; 
		}
		if (! oneCase['onError']){
			oneCase['onError'] = { '$': "", "@action": "next" }; 
		}
		if (! oneCase['impact']){
			oneCase['impact'] = {'$':"impact"}; 
		}
		if (! oneCase['retry']) {
			oneCase['retry'] = {  '$': "", "@type": "next", "@Condition": "", "@Condvalue": "", "@count": "" , "@interval": ""};
		}

		items.push('<label class="col-md-2 text-right" >Path</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-path" value="'+oneCase['path']['$']+'" />');

		items.push('<label class="col-md-2 text-right" >Context</label>');
		items.push('<select type="text" class="col-md-4 text-right" id="'+s+':"-context" value="'+oneCase['context']['$']+'" >');
		items.push('<option value="positive">positive</option>'); 
		items.push('<option value="negative">negative</option>'); 
		items.push('</select>'); 


		items.push('<label class="col-md-2 text-right" >Run Type</label>');
		items.push('<select type="text" class="col-md-4 text-right" id="'+s+':"-runtype" value="'+oneCase['runtype']['$']+'" >');
		items.push('<option value="sequential_keywords">sequential_keywords</option>'); 
		items.push('<option value="parallel_keywords">parallel_keywords</option>'); 
		items.push('</select>'); 

		items.push('<label class="col-md-2 text-right" >OnError-at-action:</label>');
		items.push('<select type="text" class="col-md-4 text-right" id="'+s+'-onError-at-action" value="'+oneCase['onError']['@action']+'" >');
		items.push('<option value="next">next</option>'); 
		items.push('<option value="abort">abort</option>'); 
		items.push('<option value="abort_as_error">abort_as_error</option>'); 
		items.push('<option value="goto">goto</option>'); 
		items.push('</select>');
		if (!oneCase['gotovalue']) { 
			oneCase['gotovalue'] = ""; 
		}
		items.push('<div class="gotocase-div" ><br>');
		items.push('<label class="col-md-2 text-right" >OnError-gotocase:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+':"-gotocase" value="'+oneCase['gotovalue']['$']+'" />');
		items.push('</div>');		
		/*
		items.push('<br><span class="label label-primary">Run mode</span><br>');
		items.push('<label class="col-md-2 text-right" >runmode-at-type:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-runmode-at-type" value="'+oneCase['runmode']['@type']+'" />');
		items.push('<label class="col-md-2 text-right" >runmode-at-value:</label>');
		items.push('<select type="text" class="col-md-4 text-right" id="'+s+'-runmode-at-value" value="'+oneCase['runmode']['@value']+'" >');
		items.push('<option value="RMT">RMT</option>'); 
		items.push('<option value="RUF">RUF</option>'); 
		items.push('<option value="RUP">RUP</option>'); 
		items.push('</select>');
		*/


		items.push('<br><span class="label label-primary">Retry</span><br>');
		items.push('<label class="col-md-2 text-right" >retry-at-type:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-retry-at-type" value="'+oneCase['retry']['@type']+'" />');
		items.push('<label class="col-md-2 text-right" >retry-at-Condition:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-retry-at-Condition" value="'+oneCase['retry']['@Condition']+'" />');
		items.push('<label class="col-md-2 text-right" >retry-at-Condvalue:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-retry-at-Condvalue" value="'+oneCase['retry']['@Condvalue']+'" />');
		items.push('<label class="col-md-2 text-right" >retry-at-count:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-retry-at-count" value="'+oneCase['retry']['@count']+'" />');
		items.push('<label class="col-md-2 text-right" >retry-at-interval:</label>');
		items.push('<input type="text" class="col-md-4 text-right" id="'+s+'-retry-at-interval" value="'+oneCase['retry']['@interval']+'" />');
		items.push('<br><span class="label label-primary">Impact</span><br>');

		items.push('<label class="col-md-2 text-right" >impact</label>');
		items.push('<select type="text" id="'+s+':"impact" value="'+oneCase['impact']['$']+'" >');
		items.push('<option value="impact">impact</option>'); 
		items.push('<option value="noimpact">noimpact</option>'); 
		items.push('</select>');
		items.push("<br>");

		// Set up the JSON object for deletion. 
		var bid = "deleteTestCase-"+s;		
		items.push("<input type=\"button\" value=\"Delete\" id='"+bid+"'>"+bid+"</input>");
		$(document).on('click','#'+bid,function(  ) {
			//alert(this.id);
			var names = this.id.split('-');
			var sid = parseInt(names[1]);
			removeTestCase(sid,xdata);
		});

		items.push("</div>");
		

	}
	// This ends the accordion display div 
	$('<div/>', { class: "col-md-12" , collapsible: "true" , html: items.join("")}).appendTo("#listOfTestCasesForSuite");
	$("#accordion_suite_display").accordion();
	// The page is rendered. Now we can link up the UI to handlers. 
	
	// Now set up handlers 
	for (var s=0; s<Object.keys(xdata).length; s++ ) {
		var oneCase = xdata[s];
		$('#'+s+'-onError-at-action').change(function() { 
			if (this.value == 'goto') { 
				$(".gotocase-div").show();
			} else { 
				$(".gotocase-div").hide();
			}
		});
	}

}  // end of function 


function removeTestCase( sid,xdata ){
			jsonTestCases['Testcase'].splice(sid,1);
			console.log("Removing test cases "+sid+" now " + Object.keys(jsonTestCases).length);
			mapSuiteJsonToUi(jsonTestCases);	// Send in the modified array
}


//#listOfTestCasesForSuite
function openAllCases() {
	// This function does not work at the moment. I have to debug it later. 
	// Kamran
	$('.collapse').collapse('show');
	$("#accordion_suite_display").collapse('show');
}


