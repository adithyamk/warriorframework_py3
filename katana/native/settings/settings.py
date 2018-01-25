# -*- coding: utf-8 -*-

import os
from utils.navigator_util import Navigator
from wui.core.apps import validate_config_json
try:
    import xmltodict
except ImportError:
    print("Please install xmltodict")
import json
import xml.etree.ElementTree as xml_controler


class Settings:

    def __init__(self):
        self.navigator = Navigator()

    def get_location(self):
        pass

    def smart_analysis_handler(self, request):
        mainFile = self.navigator.get_warrior_dir() + os.sep + 'Tools' + os.sep + 'connection' + os.sep +'connect_settings.xml'
        if request.method == 'POST':
            val = xmltodict.unparse({'credentials': {'system': json.loads(request.POST.get('data'))}}, pretty=True)
            with open(mainFile, 'w') as f:
                f.write(val)
        else:
            with open(mainFile, 'r') as f:
                mainDict = xmltodict.parse(f)['credentials']
            if mainDict is not None and not isinstance(mainDict['system'], list):
                mainDict['system'] = [mainDict['system']]

            return mainDict

    def general_setting_handler(self, request):
        json_file = self.navigator.get_katana_dir() + os.sep + 'config.json'
        w_settings = self.navigator.get_warrior_dir() + 'Tools' + os.sep + 'w_settings.xml'
        elem_file = xml_controler.parse(w_settings)
        elem_file = elem_file.getroot()
        elem = self.search_by_name('def_dir', elem_file)
        def_dir_string = xml_controler.tostring(elem)
        def_dir_xml_obj = elem

        if request.method == 'POST':
            w_settings_data = {'Setting': {'Logsdir': '', 'Resultsdir': '', '@name': ''}}
            returned_json = json.loads(request.POST.get('data'))
            for k, v in list(w_settings_data['Setting'].items()):
                w_settings_data['Setting'][k] = returned_json[0][k]
                del returned_json[0][k]

            elem_file.remove(def_dir_xml_obj)
            val = xmltodict.unparse(w_settings_data, pretty=True)
            elem_file.insert(0, xml_controler.fromstring(val))
            with open(w_settings, 'w') as f:
                f.write(xml_controler.tostring(elem_file))
            with open(json_file, 'w') as f:
                f.write(json.dumps(returned_json[0], indent=4, separators=(',', ': ')))
        else:
            with open(json_file, 'r') as f:
                json_data = json.load(f)
            data = {'fromXml': xmltodict.parse(def_dir_string).get('Setting'),
                    'fromJson': validate_config_json(json_data, self.navigator.get_warrior_dir())}
            return data

    def profile_setting_handler(self, request):
        json_file = self.navigator.get_katana_dir() + os.sep + 'user_profile.json'
        config_json_file = self.navigator.get_katana_dir() + os.sep + 'config.json'
        if request.method == 'POST':
            data = json.loads(request.POST.get('data'))
            with open(json_file,'w') as f:
                f.write(json.dumps(data[0], sort_keys=True, indent=4, separators=(',', ': ')))
            with open(config_json_file,'r+') as a:
                new_json = json.load(a)
                new_json['engineer'] = data[0]['firstName']
                a.seek(0)
                a.truncate()
                a.write(json.dumps(new_json, sort_keys=True, indent=4, separators=(',', ': ')))
        else:
            with open(json_file,'r') as f:
                json_data = json.load(f)

            return json_data

    def search_by_name(self, name, file):
        for elem in file.findall('Setting'):
            if elem.get('name') == name:
                return elem

    def email_setting_handler(self, request):
        w_settings = self.navigator.get_warrior_dir() + 'Tools'+ os.sep + 'w_settings.xml'
        elem_file = xml_controler.parse(w_settings)
        elem_file = elem_file.getroot()
        elem = self.search_by_name('mail_to', elem_file)
        email_string = xml_controler.tostring(elem)
        email_xml_obj = elem

        if request.method == 'POST':
            elem_file.remove(email_xml_obj)
            val = xmltodict.unparse({ 'Setting' : json.loads(request.POST.get('data')) }, pretty = True)
            elem_file.append(xml_controler.fromstring(val) )
            with open(w_settings,'w') as f:
                f.write(xml_controler.tostring(elem_file))
        else:
            xmldoc = xmltodict.parse(email_string)
            return xmldoc

    def jira_setting_handler(self, request):
        jira_config = self.navigator.get_warrior_dir() + 'Tools' + os.sep + 'jira' + os.sep +'jira_config.xml'
        elem_file = xml_controler.parse(jira_config)
        elem_file = elem_file.getroot()
        xml_string = xml_controler.tostring(elem_file)
        if request.method == 'POST':
            val = xmltodict.unparse( {'jira' : { 'system' : json.loads(request.POST.get('data')) }}, pretty = True)
            with open(jira_config,'w') as f:
                f.write(val)
        else:
            xmldoc = xmltodict.parse(xml_string)
            if xmldoc is not None and xmldoc['jira'] is not None:
                if not isinstance( xmldoc['jira']['system'], list):
                    xmldoc['jira']['system'] = [ xmldoc['jira']['system']]
                for system in xmldoc['jira']['system']:
                    for k, v in list(system.items()):
                        if k == 'issue_type':
                            v = json.dumps(v)
                            system[k] = v
            return xmldoc

    def secret_handler(self, request):
        keyDoc = self.navigator.get_warrior_dir() + os.sep + 'Tools' + os.sep + 'admin' + os.sep +'secret.key'
        if request.method == 'POST':
            val = request.POST.get("data[0][value]")
            elem_file = open(keyDoc, 'w')
            elem_file.write(val)
            elem_file.close()
        else:
            elem_file = open(keyDoc, 'r')
            key_data = elem_file.read()
            elem_file.close()
            return key_data
