"""
Copyright 2017, Fujitsu Network Communications, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import os

import Tools
from Framework.Utils import xml_Utils, file_Utils
from Framework.Utils.testcase_Utils import pNote
from Framework.Utils.print_Utils import print_info
from Framework.Utils.xml_Utils import getElementWithTagAttribValueMatch

__author__ = 'Keenan Jabri'


class LineResult:
    """Class that generates html result line items"""
    data = {}
    html = ''

    def __init__(self):
        pass

    def set_dynamic_content(self, line):
        self.data['dynamic'] = [line.get("keywords"), line.get("passes"), line.get("failures"), line.get("errors"),
                                line.get("exceptions"), line.get("skipped")]
        self.data['timestamp'] = line.get("timestamp")

    def set_attributes(self, line, type, stepcount):
        if 'Keyword' not in type and 'step' not in type:
            stepcount = ''
        self.data = {'nameAttr': type + 'Record',
                     'type': type.replace('Test', '').replace('Keyword', 'step ') + str(stepcount),
                     'name': line.get("name"),
                     'info': line.get("title"),
                     'timestamp': line.get("timestamp"),
                     'duration': line.get("time"),
                     'status': line.get("status"),
                     'impact': line.get("impact"),
                     'onerror': line.get("onerror"),
                     'msc': '<span style="padding-left:10px; padding-right: 10px;"><a href="' + (
                         line.get("resultfile") if line.get(
                             "resultfile") else '') + '"><i class="fa fa-line-chart"> </i></a></span><span '
                                                      'style="padding-left:10px; padding-right: 10px;"><a href="' + ( 
                                line.get("logsdir") if line.get(
                                    "logsdir") else '') + '"><i class="fa fa-book"> </i></a></span>',
                     'static': ['Count', 'Passed', 'Failed', 'Errors', 'Exceptions', 'Skipped']
                     }
        self.keys = ['type', 'name', 'info', 'timestamp', 'duration', 'status', 'impact', 'onerror', 'msc', 'static',
                     'dynamic']

    def set_html(self, line, type, stepcount):
        if self.html == '':
            self.set_attributes(line, type, stepcount)
        self.set_dynamic_content(line)
        top_level = ''
        top_level_next = ''
        if self.data['nameAttr'] != 'KeywordRecord':
            for elem in self.keys:
                if elem == 'dynamic':
                    for dynamicElem in self.data['dynamic']:
                        top_level_next += '<td>' + (dynamicElem if dynamicElem else '0') + '</td>'
                elif elem == 'static':
                    for staticElem in self.data['static']:
                        top_level += '<td>' + (staticElem if staticElem else '') + '</td>'
                else:
                    top_level += '<td rowspan="2"><div>' + (self.data[elem] if self.data[elem] else '') + '</div></td>'
            top_level_next = '<tr>' + top_level_next + '</tr>'
        else:
            for elem in self.keys:
                if elem != 'static' and elem != 'dynamic':
                    top_level += '<td rowspan="2"><div>' + (self.data[elem] if self.data[elem] else '') + '</div></td>'

        self.html = '<tr name="' + self.data['nameAttr'] + '">' + top_level + '</tr>' + top_level_next


class WarriorHtmlResults:
    """Class that generates html results using hte junit result file """
    lineObjs = []
    lineCount = 0
    recount = 0
    steps = 0

    def __init__(self, junit_file=None):
        """ init function"""
        self.junit_file = junit_file
        self.html_template = "{0}{1}reporting{1}html_results_template.html" \
            .format(Tools.__path__[0], os.sep)
        self.junit_root = xml_Utils.getRoot(self.junit_file)

    def create_line_result(self, line, type):
        """ create new objs"""
        temp = LineResult()
        temp.set_html(line, type, self.steps)
        self.lineObjs.append(temp)
        self.lineCount += 1

    def set_line_objs(self):
        """ call to create a new obj per item"""
        self.lineCount = 0
        project_node_list = [self.junit_root]
        for project_node in project_node_list:
            self.create_line_result(project_node, "Project")
            for testsuite_node in project_node.findall("testsuite"):
                self.create_line_result(testsuite_node, "Testsuite")
                for testcase_node in testsuite_node.findall("testcase"):
                    self.create_line_result(testcase_node, "Testcase")
                    self.steps = 0
                    for step_node in testcase_node.findall("properties"):
                        for node in step_node.findall("property"):
                            if node.get('type') == 'keyword':
                                self.steps += 1
                                self.create_line_result(node, "Keyword")

    def get_path(self):
        """ get the html results path """
        filename = file_Utils.getNameOnly(os.path.basename(self.junit_file))
        filename = filename.split("_junit")[0]
        html_filename = filename + ".html"
        if hasattr(self, 'givenPath'):
            html_results_path = self.givenPath + os.sep + html_filename
        else:
            results_dir = os.path.dirname(self.junit_file)
            html_results_path = results_dir + os.sep + html_filename

        return html_results_path

    def merge_html(self, dynamic_html):
        """ merge html from template and dynamic """
        temp = open(self.html_template)
        templateHTML = temp.read().replace('\n', '')
        temp.close()
        index = templateHTML.rfind('</table>')
        return templateHTML[:index] + dynamic_html + templateHTML[index:] + self.get_war_version()

    def get_war_version(self):
        """ find the warrior version """
        path = self.get_path().split('warriorframework')[0] + 'warriorframework/version.txt'
        if os.path.isfile(path):
            version = open(path, 'r').read().split(':')[2]
            return '<div class="version">' + version + '</div>'
        else:
            return ''

    def generateHTML(self, junitObj, givenPath):
        """ build the html """
        if junitObj:
            self.junit_file = junitObj
            self.junit_root = xml_Utils.getRoot(self.junit_file)
        if givenPath:
            self.givenPath = givenPath

        self.set_line_objs()
        html = ''
        for item in self.lineObjs:
            html += item.html
        html = self.merge_html(html)

        elem_file = open(self.get_path(), 'w')
        elem_file.write(html)
        elem_file.close()
        self.lineObjs = []
        print_info("++++ Results Summary ++++")
        print_info("Open the Results summary file given below in a browser to "
                   "view results summary for this execution")
        print_info("Results sumary file: {0}".format(self.get_path()))
        print_info("+++++++++++++++++++++++++")

    def output_html(self, print_summary=True):
        """Output the html file and its required
        script/stylesheets/bootstrap files to results folder """
        tree = ET.ElementTree(self.html_root)
        tree.write(self.html_results_path)
        if print_summary is True:
            print_info("++++ Results Summary ++++")
            print_info("Open the Results summary file given below in a browser"
                       " to view results summary for this execution")
            print_info("Results sumary file: {0}".format(self.html_results_path))
            print_info("+++++++++++++++++++++++++")

