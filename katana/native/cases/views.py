"""
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

"""


from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.template.context_processors import csrf
import os, sys, glob, copy 
from collections import OrderedDict
from django.http import HttpResponse, JsonResponse
from django.template import loader, RequestContext
from xml.sax.saxutils import escape, unescape
import xml.dom.minidom 
import xmltodict , dicttoxml
from django.core.serializers import serialize
from django.db.models.query import QuerySet
from django.template import Library
from xmljson import badgerfish as bf
from xml.etree.ElementTree import fromstring, tostring
import xml.etree.ElementTree

from utils.navigator_util import Navigator

path_to_demo="/home/khusain/Projects/xml-edit/warriorframework/katana/vdj/cases/"
path_to_testcases='/home/khusain/Projects/xml-edit/warriorframework/wftests/warrior_tests/';
path_to_productdrivers='/home/khusain/Projects/xml-edit/warriorframework/warrior/ProductDrivers/'
navigator = Navigator();

#

def index(request):
	path_to_testcases = navigator.get_warrior_dir() + "/../wftests/warrior_tests/"
	template = loader.get_template("listAllCases.html")
	#filename = request.GET.get('fname')
	# files = next(os.walk('/home/khusain/Projects/xml-edit/warriorframework/wftests/warrior_tests/testcases'))[2]
	fpath = path_to_testcases + 'testcases';
	#files = [ os.path.join(fpath,x) for x in (os.walk(fpath))[2]]

	files = glob.glob(fpath+"*/*/*.xml")+glob.glob(fpath+"*/*/*/*.xml")

	allfiles = {}
	files = glob.glob(fpath+"*/*/*.xml")
	for fn in files: 
		fpf,fpb = os.path.split(fn)
		if not allfiles.has_key(fpf): allfiles[fpf] = []
		allfiles[fpf].append( { 'full': fn, 'display': fpb})
	files = glob.glob(fpath+"*/*/*/*.xml")
	for fn in files: 
		fpf,fpb = os.path.split(fn)
		if not allfiles.has_key(fpf): allfiles[fpf] = []
		allfiles[fpf].append( { 'full': fn, 'display': fpb})

	context = { 
		'title' : 'List of Cases',	
		'docSpec': 'caseSpec',
		'listOfFiles': files	,
		'displayList' : allfiles, 
		'displayDirs' : allfiles.keys()
	}
	return HttpResponse(template.render(context, request))


def editCase(request):
	""" 
	Set up JSON object for editing a suites file. 
	"""
	path_to_testcases = navigator.get_warrior_dir() + "/../wftests/warrior_tests/"
	
	template = loader.get_template("editCase.html")
	filename = request.GET.get('fname')

	# Open the XML file and get it's dictionary...
	# Make exceptions for missing or badly formatted files. 
	
	# Set up defaults for an xml_r object

	xml_r = {}
	xml_r["Testcase"] = {}
	xml_r["Testcase"]["Details"] = {}
	xml_r["Testcase"]["Details"]["Name"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Title"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Category"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Engineer"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Date"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Time"] = { "$": ""}
	xml_r["Testcase"]["Details"]["State"] = { "$": ""}
	xml_r["Testcase"]["Details"]["InputDataFile"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Datatype"] = { "$": ""}
	xml_r["Testcase"]["Details"]["default_onError"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Logsdir"] = { "$": ""}
	xml_r["Testcase"]["Details"]["Resultsdir"] = { "$": ""}
	xml_r["Testcase"]["Details"]["ExpectedResults"] = 	{ "$": ""}
	xml_r["Testcase"]["Requirements"] = {} 
	xml_r["Testcase"]["Steps"] = {} 
	
	
	xlines = open(filename).read()
	xml_d = bf.data(fromstring(xlines)); # xmltodict.parse(fd1.read());

	# Map the input to the response collector
	for xstr in ["Name", "Title", "Category", "Date", "Time", "InputDataFile", "Engineer", \
		"Datatype", "default_onError", "Logsdir", "Resultsdir", "ExpectedResults"]:
		try:
			xml_r["Testcase"]["Details"][xstr] = copy.copy(xml_d["Testcase"]["Details"].get(xstr, { "$": ""}))
			if not xml_r["Testcase"]["Details"][xstr].has_key('$'): xml_r["Testcase"]["Details"][xstr]["$"]="";
		except:
			pass

	caseStateOptions_str = ['New','Draft','In Review','Released']

	try:
		xml_r['Testcase']['Steps'] = copy.deepcopy(xml_d['Testcase']['Steps']);
	except:
		xml_r["Testcase"]["Steps"] = {}

	try:
		xml_r['Testcase']['Requirements'] = copy.deepcopy(xml_d['Testcase']['Requirements']);
	except:
		xml_r["Testcase"]["Requirements"] = {}

	context = { 
		'myfile': filename,
		'docSpec': 'caseSpec',
		'caseName': xml_r["Testcase"]["Details"]["Name"]["$"],
		'caseTitle': xml_r["Testcase"]["Details"]["Title"]["$"],
		'caseEngineer': xml_r["Testcase"]["Details"]["Engineer"]["$"],
		'caseCategory': xml_r["Testcase"]["Details"]["Category"]["$"],
		'caseDate': xml_r["Testcase"]["Details"]["Date"]["$"],
		'caseTime': xml_r["Testcase"]["Details"]["Time"]["$"],
		'caseState': xml_r["Testcase"]["Details"]["State"]["$"],
		'caseStateOptions': caseStateOptions_str, 
		'caseDatatype': xml_r["Testcase"]["Details"]["Datatype"]["$"],
		'caseInputDataFile': xml_r["Testcase"]["Details"]["InputDataFile"]["$"],
		'casedefault_onError': xml_r["Testcase"]["Details"]["default_onError"],
		'caseLogsdir': xml_r["Testcase"]["Details"]["Logsdir"]["$"],
		'caseResultsdir': xml_r["Testcase"]["Details"]["Resultsdir"]["$"],
		'caseExpectedResults': xml_r["Testcase"]["Details"]["ExpectedResults"]["$"],
		'caseSteps': xml_r["Testcase"]["Steps"],
		'caseRequirements': xml_r['Testcase']['Requirements'],
		'fulljson': xml_r['Testcase']
	}

	return HttpResponse(template.render(context, request))
