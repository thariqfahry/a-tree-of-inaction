import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup, SoupStrainer
from collections import Counter

headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
}


def choose_scraper_function(url):
    # Assume all URLs passed to urlparse() are prepended with http://.
    parsed_url = urlparse(url)

    if parsed_url.netloc == 'linktr.ee':
        return scrape_linktree_links

    if 'carrd.co' in parsed_url.netloc:
        return scrape_carrd_links

    return None


def normalize(links):
    # normalize links however we can
    for idx, tup in enumerate(links):
        parsed = urlparse(tup[0])._replace(fragment='', scheme='https')
        if parsed.path.endswith('/'):
            parsed = parsed._replace(path=parsed.path.rstrip('/'))
        if parsed.netloc.startswith('www.'):
            parsed = parsed._replace(netloc=parsed.netloc.lstrip('www.'))
        links[idx] = (parsed.geturl(), tup[1])

    # remove duplicates
    links = list(dict(links).items())

    # if more than 50% of the links are the same - it's likely the page wasn't scraped properly
    if links:
        if max(Counter([tup[1] for tup in links]).values()) > len(links)*.5:
            return []

    return links


'''
Linktree: we know exactly where the links are: they're in a StyledContainer.
'''


def scrape_linktree_links(url):
    page = requests.get(url, headers)
    page.raise_for_status()

    soup = BeautifulSoup(page.content, features='html.parser')

    # Get a list of (url,name) tuples for the links in all the StyledContainers in the linktree page.
    links = [(element.a.get('href'), element.a.p.contents[0])
             for element in soup.find_all(attrs={'data-testid': 'StyledContainer'})
             if element.a.get('href').startswith('http')]

    links = [tup for tup in links if not tup[0].startswith(url)]

    return normalize(links), BeautifulSoup(page.content, features='html.parser').title.contents[0]


'''
Carrd: sometimes in <a href=url>name<a>, sometimes in <span>s.
'''


def scrape_carrd_links(url):

    page = requests.get(url, headers)
    page.raise_for_status()

    soup = BeautifulSoup(page.content,
                         parse_only=SoupStrainer('a'), features='html.parser')

    links = [(elem.get('href'), str(elem.string))
             for elem in soup if elem.get('href').startswith('http') and elem.string]

    # Alternative Carrd parser, if more than 50% of names return None since they are in a <span>
    links2 = [(elem.get('href'), str(elem.select_one('.label').string))
              for elem in soup if elem.get('href').startswith('http') and elem.select_one('.label')]

    links = max(links, links2, key=len)

    links = [tup for tup in links if not tup[0].startswith(url)
             and not tup[0] == 'https://carrd.co']

    return normalize(links), BeautifulSoup(page.content, features='html.parser').title.contents[0]