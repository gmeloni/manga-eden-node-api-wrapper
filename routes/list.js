

var express = require('express');
var mangaListRouter = express.Router();
var rest = require('restler');

// definition of the endpoints to retrieve the manga list, the manga info, and the manga's image download
var mangaListUrl = 'https://www.mangaeden.com/api/list/';
//var mangaUrl = 'https://www.mangaeden.com/api/manga/';
var downloadUrl = 'https://cdn.mangaeden.com/mangasimg/';

mangaListRouter.route('/api/v1/list/:language')

    .get(function (req, res, next) {

        var mangaUrl = req.protocol + '://' + req.get('host') + '/api/v1/manga/';

        var requestLanguage = req.params.language.toLowerCase();

        if (!(requestLanguage == 'it'.toLowerCase()) && !(requestLanguage == 'en'.toLowerCase())) {

            var languageErrorDescription = '[' + requestLanguage + '] is not a supported language; use [en] or [it] instead.';
            return error400(languageErrorDescription, res);

        }

        var language = (requestLanguage == 'it') ? '1/' : '0/';

        var page = req.query.page;

        if (page < 0) {

            var pageErrorDescription = 'The page number should be equal or greater than 0.';
            return error400(pageErrorDescription, res);

        }

        var listSize = req.query.size;

        if (listSize != null && page == null) {
            var pageNotSpecifiedErrorDescription = 'The number of mangas per page should be specified together with the page number';
            return error400(pageNotSpecifiedErrorDescription, res);
        }

        if (listSize < 25 || listSize > 2000) {

            var listSizeErrorDescription = 'The number of mangas per page should be enclosed in the interval [25;2000]';
            return error400(listSizeErrorDescription, res);

        }

        var pageQuery =  (page != null) ? '?p=' + page : '';
        var listSizeQuery = (listSize != null) ? '&l=' + listSize : '';

        var url = mangaListUrl + language + pageQuery + listSizeQuery;
        var options = {
            parsers: 'parsers.json'
        };

        rest.get(url, options)

            .on('success', function (result,response) {

                var data = result;
                data.manga = result.manga;

                if (data.manga.length < 1) {

                    var combinationErrorDescription =
                        'The manga list is empty; ' +
                        'you chose a page number too large for the page size (if not specified, the default is 500 mangas per page). ' +
                        'The total number of mangas available is: ' + data.total + '.';
                    return error400(combinationErrorDescription, res);

                }

                for (var i = 0; i < data.manga.length; i++) {

                    data.manga[i].title = data.manga[i].t;
                    delete data.manga[i].t;
                    data.manga[i].alias = data.manga[i].a;
                    delete data.manga[i].a;
                    data.manga[i].categories = data.manga[i].c;
                    delete data.manga[i].c;
                    data.manga[i].status = data.manga[i].s;
                    delete data.manga[i].s;
                    data.manga[i].image_link = downloadUrl + data.manga[i].im;
                    delete data.manga[i].im;
                    data.manga[i].id = data.manga[i].i;
                    delete data.manga[i].i;
                    data.manga[i].link = mangaUrl + data.manga[i].id + '/';
                    data.manga[i].last_chapter_date = data.manga[i].ld;
                    delete data.manga[i].ld;
                    data.manga[i].hits = data.manga[i].h;
                    delete data.manga[i].h;

                }

                return sendResponse(data, res);

            })

            .on('fail', function (result, response) {

                var genericErrorDescription = 'Some unknown error occurred in calling Manga Eden API; the site returned: ' + response.statusCode + ' ' + response.statusMessage;
                return error500(genericErrorDescription, res);

            });

    });

function sendResponse(data, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify(data));
}

function error400(description, res) {
    var err = {};
    err.status = 400;
    err.message = 'Bad Request';
    err.description = description;
    res.setHeader('Content-Type','application/json');
    res.status(400);
    res.send(JSON.stringify(err));
}

function error500(description, res) {
    var err = {};
    err.status = 500;
    err.message = 'Internal Server Error';
    err.description = description;
    res.setHeader('Content-Type','application/json');
    res.status(500);
    res.send(JSON.stringify(err));
}

module.exports = mangaListRouter;