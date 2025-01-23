import traceback

from flask import Flask, app, jsonify, request
from flask_cors import CORS

from scrapers import choose_scraper_function

app = Flask(__name__)
CORS(app)

class Node:
    __slots__ = ['url', 'name', 'visit_order', 'expandable', 'children']

    def __init__(self, url=None, name=None,  children=None):
        self.url = url
        self.name = name
        self.visit_order = None
        self.expandable = bool(choose_scraper_function(self.url))

        if children is None:
            self.children = []
        else:
            assert type(children) == list
            self.children = children

    @property
    def json_serializable(self):
        return {'url': str(self.url),
                'name': str(self.name),
                'expandable': self.expandable,
                'children': [child.json_serializable for child in self.children]}

    def __getitem__(self, index):
        return self.children[index]

    def __len__(self):
        return len(self.children)

    def __repr__(self):
        return f'{self.name} [{self.visit_order if self.visit_order else ""}]{"*" if self.expandable else ""}'

    def add(self, item):
        self.children.append(item)


class Session:
    def explore(self, url):
        '''
        Takes a valid URL and returns a list of (url, webpage_name) tuples + page title that were found on the page the URL points to
        The list must be sorted so that further scrapable links are at the top.
        If the page has been a) visited already, or b) not a scrapable site, the function returns an empty list.
        '''
        scraper_function = choose_scraper_function(url)
        # URL scrapable, HTTP request successfully made and scraped
        if scraper_function:
            links, title = scraper_function(url)

            # remove links to self
            links = [tup for tup in links if tup[0]!= url]

            # Sorts by if URL is scrapable or not
            return sorted(links,
                          key=lambda item: bool(
                              choose_scraper_function(item[0])),
                          reverse=True), title  # item is a tuple (url,name).

        # if not scrapable
        return [], None

    def __repr__(self):
        return f'Session [{self.base_url}], {self.return_val["status"]}'

    def __init__(self, base_url, max_width=20):
        if max_width < 0:
            max_width = 999

        self.base, self.exceptions = None, []
        self.base_url = base_url
        self.status = 'failed: did not run'
        self.success = False
        self.tree = None

        try:
            if not base_url.startswith('http://') and not base_url.startswith('https://'):
                base_url = 'https://' + base_url
            if base_url.endswith('/'):
                base_url = base_url.rstrip('/')

            assert choose_scraper_function(base_url), 'Base URL not scrapable'

            links, title = self.explore(base_url)
            links = links[:max_width]
            self.base = Node(url=base_url, name=title)
            self.base.children = [Node(url=tup[0], name=tup[1])
                                  for tup in links]

        except Exception as e:
            self.status = 'failed : uncaught exception raised'
            self.exceptions.append(traceback.format_exc())
            traceback.print_exc()
        else:
            self.status = 'success: page scraped'
            self.success = True

        if self.base is not None:
            self.tree = self.base.json_serializable

        self.return_val = {'success'    :self.success,
                           'status'     :self.status,
                           'tree'       :self.tree,
                           'exceptions' :self.exceptions
                           }


@app.route('/', methods=['POST'])
def trigger():
    return_val = {
        'success'       : False,
        'status'        : 'failed: invalid request',
        'tree'          : None,
        'exceptions'    : None
    }
    try:
        request_json = request.json

        if request_json and 'url' in request_json and 'width' in request_json:

            url = request_json['url']
            width = int(request_json['width'])

            session = Session(base_url=url, max_width=width)
            return_val = session.return_val

            print(request_json['url'],' ',return_val['status'],' ',return_val['exceptions'])

    except Exception as e:
        return_val['status'] = 'failed: uncaught exception raised in Cloud Function',
        return_val['exceptions'] = [traceback.format_exc()]
        print(request.get_data(), return_val['status'],' ',return_val['exceptions'])

    return jsonify(return_val)
