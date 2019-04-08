var url = require('url');
var Stremio = require("stremio-addons");
var magnet = require("magnet-uri");
const fs = require("fs");
const cheerio = require('cheerio');
var sqlite = require('sqlite-sync');
sqlite.connect('../stremiodublado/linhas.sqlite3');
var request = require('sync-request');
var express = require('express');
var ourImdbIds2 = "";
var ourImdbIds3 = [];
/*
 cd C:\Users\Mateus\Dropbox\Aplicativos\Heroku\stremiodublado
 git add .
 git commit -am "make it better"
 git push heroku master
 */
//carregar ("http://hidratorrent.com/dragon-ball-super-3-temporada-completa-torrent");

var localtunnel = require('localtunnel');

var tunnel = localtunnel(7001, {subdomain: 'stremiobusca'}, function (err, tunnel) {
    l(tunnel.url);
});

var server = require("http").createServer(function (req, res) {

    var q = url.parse(req.url, true);
    var qdata = q.query;
    var urll = q.pathname;
    var query = qdata;

    if (urll == "/comando") {
        /*res.set('Content-Type', 'text/html');
         res.end("\
         Comandos: <br>\n\
         /lista?q=http://hidratorrent.com/maisbaixados-filmes<br>\n\
         /lista?q=http://hidratorrent.com/lancamentos-filmes<br>\n\
         /lista?q=https://ondeeubaixo.com.br/lancamentos-filmes<br>\n\
         /buscarHidra?q=creed<br>\n\
         /lancamentosHidra<br>\n\
         /lancamentosOndeEuBaixo<br>\n\
         /link?q=http://hidratorrent.com/cacadora-de-gigantes-torrent<br>\n\
         /link?i=tt3007640&q=https://www.baixarfilmetorrent.net/largados-e-pelados-3a-temporada-completa-torrent-dublada-e-legendada/<br>\n\
         <br><br><br>\n\
         URL: <input type='text' id='texto'><br>\n\
         IMDB:  <input type='text' id='imdb'><br><br>\n\
         <a href onclick=\"window.open('/lista?q='+document.getElementById('texto').value, '_blank');\" >Carregar Lista</a><br>\n\
         <a href onclick=\"window.open('/buscarHidra?q='+document.getElementById('texto').value, '_blank');\" >Carregar Busca</a><br>\n\
         <a href onclick=\"window.open('/lancamentosHidra', '_blank');\" >Carregar Lançamentos</a><br>\n\
         <a href onclick=\"window.open('/link?q='+document.getElementById('texto').value, '_blank');\" >Carregar Link</a><br>\n\
         <a href onclick=\"window.open('/link?i='+document.getElementById('imdb').value+'&q='+document.getElementById('texto').value, '_blank');\" >Carregar Link + IMDB</a><br>\n\
         <br><br>\n\
         <a href='https://dashboard.heroku.com/apps/nodestremio/logs' target='_blank'>Log</a><br>\n\
         <br>\n\
         */
        // res.send('');
    }
    if (urll == "/buscarHidra") {

        dataset = [];
        dataset_links = [];
        dataset_hashs = [];
        dataset_links.push(["Tipo", "Link"]);
        dataset_hashs.push(["hash", "magnet", "imdb", "img"]);
        console.log(query.q);
        carregarBusca(query.q);

    }
    if (url == "/lista") {

        dataset = [];
        dataset_links = [];
        dataset_hashs = [];
        dataset_links.push(["Tipo", "Link"]);
        dataset_hashs.push(["hash", "magnet", "imdb", "img"]);
        console.log(query.q);
        lista(query.q + "-", 1, 3);

    }
    if (urll == "/link") {

        dataset = [];
        dataset_links = [];
        dataset_hashs = [];
        dataset_links.push(["Tipo", "Link"]);
        dataset_hashs.push(["hash", "magnet", "imdb", "img"]);
        console.log(query.q);
        dataset_links.push(query.q);
        var im = query.i;
        if (im) {
            retorno_carregar_links_imdb(im);
        } else {
            retorno_carregar_links();
        }
        retorno_carregar_hashs();
        append_dataset();
    }
    if (urll == "/lancamentosHidra") {

        dataset = [];
        dataset_links = [];
        dataset_hashs = [];
        dataset_links.push(["Tipo", "Link"]);
        dataset_hashs.push(["hash", "magnet", "imdb", "img"]);

        l('Lançamentos');
        lista("http://hidratorrent.com/lancamentos-", 1, 3);

    }
    if (urll == "/lancamentosOndeEuBaixo") {

        dataset = [];
        dataset_links = [];
        dataset_hashs = [];
        dataset_links.push(["Tipo", "Link"]);
        dataset_hashs.push(["hash", "magnet", "imdb", "img"]);
        l('Lançamentos');
        lista("https://ondeeubaixo.com.br/lancamentos-", 1, 3);


    }

}).on("listening", function ()
{
    console.log(server.address());

}).listen(7001);

var dataset = [];
var dataset_links = [];
var dataset_hashs = [];
//dataset.push(["Tipo","IMDB","Magnet","Map","Arquivo","Título", "Seed", "Imagem"]);
dataset_links.push(["Tipo", "Link"]);
dataset_hashs.push(["hash", "magnet", "imdb", "img"]);

function append_dataset() {
    l('append_dataset');
    //DELETE FROM registros WHERE id NOT IN (SELECT min(id) FROM registros GROUP BY imdb, magnet, mapa);

    dataset.forEach(function (v) {
        var campos = v;
        //console.log(campos);
        var imdb = campos[1];
        var mag = campos[2];
        var map = campos[3];
        var nome = campos[4];
        sqlite.run("INSERT INTO registros VALUES (null,'" + imdb + "','" + mag + "','" + map + "','" + nome + "')");


    });

    sqlite.run('DELETE FROM registros WHERE id NOT IN (SELECT min(id) FROM registros GROUP BY imdb, magnet, mapa)');
    console.log("Fim");


}


function carregarBusca(busca) {

    var p = "https://hidratorrent.com/torrent-" + busca + "/1";
    l(p);
    var res = request('GET', p);
    var data = res.getBody('utf8');
    carregar_links(data);
    retorno_carregar_links();
    retorno_carregar_hashs();
    append_dataset();


}

function lista(tipo, ini, tamanho) {

    for (i = ini; i < (ini + tamanho); i++) {

        var p = tipo + i;
        l(p);
        var res = request('GET', p);
        var data = res.getBody('utf8');
        carregar_links(data);
    }
    retorno_carregar_links();
    retorno_carregar_hashs();
    append_dataset();


}
function carregar_links(data) {

//append(data[1]);

    const $ = cheerio.load(data);

    var titulos = $('.list-inline > li');

    titulos.each(function (index, elem) {

        var link = $(this).find('a')[0].attribs.href;
        var dublado = $(this).find('.idioma_lista').text().trim();

        if (dublado == "Dublado") {
            l(link);
            dataset_links.push(link);
        }
    });
}
function retorno_carregar_links() {

    l('retorno_carregar_links');
    for (var n = 1; n < dataset_links.length; n++) {

        var p = dataset_links[n];
        var res = request('GET', p);
        const $ = cheerio.load(res.getBody('utf8'));
        var id_imdb = "";
        try {
            id_imdb = $("a[href*='www.imdb.com']").get(0).attribs.href;
            id_imdb = id_imdb.replace("http://www.imdb.com/title/", "").replace("https://www.imdb.com/title/", "").replace("/", "").replace("/", "").replace("?ref_=nv_sr_", "").replace("?ref_=plg_rt_1", "").replace("http:www.imdb.com", "").trim();
        } catch (e) {
        }

        l('IMDB:' + id_imdb);
        $("a[href*='magnet:?xt=urn']").each(function (index, elem) {

            var title = this.attribs.title;
            var mag = this.attribs.href;
            var index = mag.indexOf('&');
            var info;
            if (index > 0) {
                info = mag.substring(19 + 1, mag.indexOf('&')).toLowerCase();
            } else {
                info = mag.substring(19 + 1).toLowerCase();
            }
            if (title) {
                if (title.toLowerCase().indexOf('legendado') > 0) {

                } else {
                    dataset_hashs.push([info, mag, id_imdb, "", "", title]);
                }
            } else {
                dataset_hashs.push([info, mag, id_imdb, "", "", ""]);
            }

        });
    }



}
function retorno_carregar_links_imdb(im) {

    l('retorno_carregar_links_imdb');
    for (var n = 1; n < dataset_links.length; n++) {

        var p = dataset_links[n];
        var res = request('GET', p);
        const $ = cheerio.load(res.getBody('utf8'));
        var id_imdb = im;

        l('IMDB:' + id_imdb);
        $("a[href*='magnet:?xt=urn']").each(function (index, elem) {

            var title = this.attribs.title;
            var mag = this.attribs.href;
            var index = mag.indexOf('&');
            var info;
            if (index > 0) {
                info = mag.substring(19 + 1, mag.indexOf('&')).toLowerCase();
            } else {
                info = mag.substring(19 + 1).toLowerCase();
            }
            if (title) {
                if (title.toLowerCase().indexOf('legendado') > 0) {

                } else {
                    dataset_hashs.push([info, mag, id_imdb, "", "", title]);
                }
            } else {
                dataset_hashs.push([info, mag, id_imdb, "", "", ""]);
            }

        });
    }



}
function retorno_carregar_hashs() {

    l('retorno_carregar_hashs');
    for (i1 = 1; i1 < dataset_hashs.length; i1++) {

        var r = dataset_hashs[i1];
        var p = "https://www.skytorrents.lol/torrent/" + r[0];
        l(p);
        var res = request('GET', p);
        r[4] = res.getBody('utf8');
        carregar_dados_imdb(r);
    }
}
function carregar_dados_imdb(data) {
    if (data[2].length == 0) {
        const $ = cheerio.load(data[4]);
        var title = $('title').text().toLowerCase().trim().replace("temporada", "").replace("720p", "").replace("dublado", "").replace("filmes beta", "").replace("sky torrents", "").replace("-", "").replace("-", "").trim();

        var p = "https://www.imdb.com/find?ref_=nv_sr_fn&q=" + title + "&s=all";
        l(p);
        var res = request('GET', p);
        const jquery = cheerio.load(res.getBody('utf8'));
        var retorno = jquery('.result_text > a').get(0);
        if (retorno) {
            retorno = retorno.attribs.href.replace('https://www.imdb.com/title/', '').replace('/?ref_=fn_al_tt_1', '').replace('/title/', '');
            data[2] = retorno;
            console.log(retorno);
        }
    }
    carregar_dados_torrent(data);

}
function carregar_dados_torrent(data) {
    l('carregar_dados_torrent');
    const $ = cheerio.load(data[4]);
    var title = $('title').text().toLowerCase().trim().replace("temporada", "").replace("720p", "").replace("dublado", "").replace("filmes beta", "").replace("sky torrents", "").replace("-", "").trim();

    //l(['Titulo', data[0], data[5], title]);
    var arquivos = $('.column.is-8.has-text-centered > div > div > table > tbody > tr');
    var id_imdb = data[2];

    if (data[0] == '454786f84767a297e3c16bcb40c8922712bdb937') {
        l("entrou");
        id_imdb = 'tt0182576';
    }

    if (id_imdb.length < 5) {
        try {
            id_imdb = $("a[href*='www.imdb.com']").get(0).attribs.href;
            id_imdb = id_imdb.replace("http://www.imdb.com/title/", "").replace("https://www.imdb.com/title/", "").replace("/", "").replace("/", "").replace("?ref_=nv_sr_", "").replace("?ref_=plg_rt_1", "");
        } catch (e) {

        }
    }

    arquivos.each(function (index) {

        if (index > 0) {

            var ar = $($(this).children().get(0)).text();
            var tm = $($(this).children().get(1)).text();
            //l('IMDB:' + id_imdb + " " + ar.trim() + " " + tm.trim());
            var final = ar.toLowerCase().substring(ar.length, ar.length - 4);

            if (id_imdb.trim().length > 5 && ar.toLowerCase() != 'comandotorrents.com.mp4' && ar.toLowerCase() != 'bludv.com.mp4') {

                if (final != '.url' && final != '.txt' && final != '.inf' && final != '.srt' && final != '.ass' && final != '.crt' && ar.toLowerCase().indexOf('.bdmv') < 1 && ar.toLowerCase().indexOf('.m2ts') < 1 && ar.toLowerCase().indexOf('.mpls') < 1 && final != '.xml' && ar.toLowerCase().indexOf('.mpls') < 1 && ar.toLowerCase().indexOf('.properties') < 1 && final != '.jar' && ar.toLowerCase().indexOf('.clpi') < 1 && ar.toLowerCase().indexOf('.bdjo') < 1 && final != '.otf' && final != '.lst' && final != '.tbl' && final != '.cer' && final != '.rar') {

                    if (final != '.jpg' && final != '.png' && ar.toLowerCase() != 'bludv.mp4' && ar.toLowerCase() != 'lapumia.mp4') {

                        var temp = temporada(ar, "", title);
                        var eps = episodio(ar, "", title);
                        if (temp > 0 && eps > 0) {
                            var mag = data[1];
                            var id = id_imdb.trim() + " " + temp + " " + eps;
                            var img = data[3];
                            var map = index - 1;
                            var filme = [];
                            filme[0] = "Série";
                            filme[1] = id;
                            filme[2] = mag;
                            filme[3] = map;
                            filme[4] = ar.trim();
                            dataset.push(filme);
                            l("Episodio adicionado: E:" + eps + " T:" + temp + " " + title);
                            //append(mag, id, temp, eps, map, ar);
                            //append(JSON.stringify(fromMagnetMap(mag, index-1)));

                        } else {

                            var mag = data[1];
                            var id = id_imdb.trim();
                            var img = data[3];
                            var map = index - 1;
                            if (ar.toLowerCase().indexOf('temporada') < 1 && title.toLowerCase().indexOf('temporada') < 1) {

                                var filme = [];
                                filme[0] = "Filme";
                                filme[1] = id;
                                filme[2] = mag;
                                filme[3] = map;
                                filme[4] = ar.trim();
                                l("Filme adicionado: " + title);
                                dataset.push(filme);
                            }

                        }

                    }
                }
            }
        }
    });

}

function limpaTitulo(t) {

    t = t.toUpperCase();
    var a = "";
    for (i = 1950; i < 2020; i++) {

        a = "-" + i;
        t = t.replace(a, '');
        a = "" + i;
        t = t.replace(a, '');
    }
    for (i = 1; i < 20; i++) {

        a = "Parte." + i;
        t = t.replace(a, '');
        a = "Parte " + i;
        t = t.replace(a, '');
    }
    t = t.replace('720', '').replace('X264', '').replace('X265', '').replace('2160P', '').replace('4K', '').replace('4K', '');
    return t;
}

function temporada(t1, t2, t3) {

    t1 = limpaTitulo(t1);
    t2 = limpaTitulo(t2);
    t3 = limpaTitulo(t3);
    // append(t1, t3);

    var tempo = "";
    var ten;
    if (ten == null) {
        ten = t1.match(/S\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/S\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/S\d\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/\.S\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/\.S\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/\.S\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/T\d\d/g); //T02 -
    }
    if (ten == null) {
        ten = t2.match(/T\d\d/g); //T02 -
    }
    if (ten == null) {
        ten = t3.match(/T\d\d/g); //T02 -
    }


    if (ten == null) {
        ten = t1.match(/TEMP \d\d -/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/TEMP \d\d -/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/TEMP \d\d -/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/\d\dª TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d\dª TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d\dª TEMPORADA/g); //10ª TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/\d\d° TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d\d° TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d\d° TEMPORADA/g); //10ª TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/\d° TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d° TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d° TEMPORADA/g); //10ª TEMPORADA
    }


    if (ten == null) {
        ten = t1.match(/\d\dº TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d\dº TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d\dº TEMPORADA/g); //10ª TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/\dº TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\dº TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\dº TEMPORADA/g); //10ª TEMPORADA
    }



    if (ten == null) {
        ten = t1.match(/ \d TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/ \d TEMPORADA/g); //10ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/ \d TEMPORADA/g); //10ª TEMPORADA
    }


    if (ten == null) {
        ten = t1.match(/\d\d TEMPORADA/g); //10 TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d\d TEMPORADA/g); //10 TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d\d TEMPORADA/g); //10 TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/\d\d\.TEMPORADA/g); //10.TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\d\d\.TEMPORADA/g); //10.TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\d\d\.TEMPORADA/g); //10.TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/\dª TEMPORADA/g); //1ª TEMPORADA
    }
    if (ten == null) {
        ten = t2.match(/\dª TEMPORADA/g); //1ª TEMPORADA
    }
    if (ten == null) {
        ten = t3.match(/\dª TEMPORADA/g); //1ª TEMPORADA
    }

    if (ten == null) {
        ten = t1.match(/ \d\d-/g); //
    }
    if (ten == null) {
        ten = t2.match(/ \d\d-/g); //
    }
    if (ten == null) {
        ten = t3.match(/ \d\d-/g); //
    }

    if (ten == null) {
        ten = t1.match(/\.\d\dX/g); //
    }
    if (ten == null) {
        ten = t2.match(/\.\d\dX/g); //
    }
    if (ten == null) {
        ten = t3.match(/\.\d\dX/g); //
    }

    if (ten == null) {
        ten = t1.match(/- \dX/g); //
    }
    if (ten == null) {
        ten = t2.match(/- \dX/g); //
    }
    if (ten == null) {
        ten = t3.match(/\- dX/g); //
    }

    if (ten == null) {
        ten = t1.match(/-\dX/g); //
    }
    if (ten == null) {
        ten = t2.match(/-\dX/g); //
    }
    if (ten == null) {
        ten = t3.match(/\-dX/g); //
    }


    if (ten == null) {
        ten = t1.match(/\d\dX/g); //
    }
    if (ten == null) {
        ten = t2.match(/\d\dX/g); //
    }
    if (ten == null) {
        ten = t3.match(/\d\dX/g); //
    }

    if (ten == null) {
        ten = t1.match(/\.\dX/g); //
    }
    if (ten == null) {
        ten = t2.match(/\.\dX/g); //
    }
    if (ten == null) {
        ten = t3.match(/\.\dX/g); //
    }

    if (ten == null) {
        ten = t1.match(/\d\d\./g); //
    }
    if (ten == null) {
        ten = t2.match(/\d\d\./g); //
    }
    if (ten == null) {
        ten = t3.match(/\d\d\./g); //
    }

    if (ten == null) {
        ten = t1.match(/TEMPORADA \d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/TEMPORADA \d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/TEMPORADA \d/g); //Temp 02 -
    }


    if (ten != null) {
        tempo = ten[0];
        var tempo2 = tempo.replace('-', '').replace('TEMPORADA', '').replace('ª', '').replace(' ', '').replace('S', '').replace('TEMP', '').replace('T', '').replace('.', '').replace('X', '').replace('°', '').replace('º', '');
        tempo = tempo2 - 0;
        //append("T:"+tempo+" " + tempo2);        

    } else {

//append("Não Encontrado: " + t1 + " " + t2 + " " + t3+ " " + log);

    }
    return tempo;
}
function episodio(t1, t2, t3) {

    t1 = limpaTitulo(t1);
    t2 = limpaTitulo(t2);
    t3 = limpaTitulo(t3);
    var tempo = "";
    var ten;
    if (ten == null) {
        ten = t1.match(/EP\I \d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/EP\I \d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/EP\I \d\d/g); //Temp 02 -
    }


    if (ten == null) {
        ten = t1.match(/E\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/E\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/E\d\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/E\.\d\d\./g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/E\.\d\d\./g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/E\.\d\d\./g); //Temp 02 -
    }


    if (ten == null) {
        ten = t1.match(/\.\d\d\d\./g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/\.\d\d\d\./g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/E\.\d\d\./g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/EP\d\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/EP\d\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/EP\d\d\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/EP\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/EP\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/EP\d\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/EP\.\d\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/EP\.\d\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/EP\.\d\d\d/g); //Temp 02 -
    }

    if (ten == null) {
        ten = t1.match(/EP\.\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t2.match(/EP\.\d\d/g); //Temp 02 -
    }
    if (ten == null) {
        ten = t3.match(/EP\.\d\d/g); //Temp 02 -
    }


    if (ten == null) {
        ten = t1.match(/-\d\d/g); //
    }
    if (ten == null) {
        ten = t2.match(/-\d\d/g); //
    }
    if (ten == null) {
        ten = t3.match(/-\d\d/g); //
    }



    if (ten == null) {
        ten = t1.match(/X\d\d/g); //
    }
    if (ten == null) {
        ten = t2.match(/X\d\d/g); //
    }
    if (ten == null) {
        ten = t3.match(/X\d\d/g); //
    }

    if (ten == null) {
        ten = t1.match(/\d\d - /g); //
    }
    if (ten == null) {
        ten = t2.match(/\d\d - /g); //
    }
    if (ten == null) {
        ten = t3.match(/\d\d - /g); //
    }

    if (ten == null) {
        ten = t1.match(/\d - /g); //
    }
    if (ten == null) {
        ten = t2.match(/\d - /g); //
    }
    if (ten == null) {
        ten = t3.match(/\d - /g); //
    }

    if (ten == null) {
        ten = t1.match(/-\d /g); //
    }
    if (ten == null) {
        ten = t2.match(/-\d /g); //
    }
    if (ten == null) {
        ten = t3.match(/-\d /g); //
    }

    if (ten == null) {
        ten = t1.match(/\d\d.MP4/g); //
    }
    if (ten == null) {
        ten = t2.match(/\d\d.MP4/g); //
    }
    if (ten == null) {
        ten = t3.match(/\d\d.MP4/g); //
    }


    if (ten != null) {
        tempo = ten[0];
        var tempo2 = tempo.replace('-', '').replace('MP4', '').replace(' ', '').replace('E', '').replace('X', '').replace('P', '').replace('.', '').replace('.', '').replace('M', '').replace('I', '');
        tempo = tempo2 - 0;
        //append("EP:"+tempo +" " + tempo2 +" " + t1 + " " + t2 + " " + t3+ " " + log);        

    } else {

//append("EP Não Encontrado: " + t1 + " " + t2 + " " + t3+ " " + log);

    }
    return tempo;
}

function l(log) {
    console.log(log);
}
    