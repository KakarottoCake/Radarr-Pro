using System.Linq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using NzbDrone.Common.Http;
using NzbDrone.Core.Download.Clients.QBittorrent;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.Download.DownloadClientTests.QBittorrentTests
{
    [TestFixture]
    public class QBittorrentReuseProxyFixture : CoreTest<QBittorrentProxyV2>
    {
        [Test]
        public void should_include_own_category_and_exact_reuse_tag_without_monitoring_other_torrents()
        {
            const string json = """
                [
                  {"hash":"owned","category":"movies-radarr-pro","tags":""},
                  {"hash":"reused","category":"upstream-movies","tags":"other, radarr-pro-reuse-movies-radarr-pro"},
                  {"hash":"unrelated","category":"upstream-movies","tags":"other"},
                  {"hash":"different-instance","category":"upstream-movies","tags":"radarr-pro-reuse-movies-radarr-pro-other"}
                ]
                """;
            Mocker.GetMock<IHttpClient>().Setup(client => client.Execute(It.IsAny<HttpRequest>()))
                .Returns<HttpRequest>(request => new HttpResponse(request, new HttpHeader(), json));

            var result = Subject.GetTorrents(new QBittorrentSettings { MovieCategory = "movies-radarr-pro" });

            result.Select(torrent => torrent.Hash).Should().BeEquivalentTo("owned", "reused");
            Mocker.GetMock<IHttpClient>().Verify(client => client.Execute(It.Is<HttpRequest>(request => request.Url.FullUri.EndsWith("/api/v2/torrents/info"))), Times.Once());
        }

        [TestCase(null)]
        [TestCase("")]
        public void empty_category_should_preserve_monitoring_all_torrents(string category)
        {
            Mocker.GetMock<IHttpClient>().Setup(client => client.Execute(It.IsAny<HttpRequest>()))
                .Returns<HttpRequest>(request => new HttpResponse(request, new HttpHeader(), "[{\"hash\":\"other\",\"category\":\"other\"}]"));

            Subject.GetTorrents(new QBittorrentSettings { MovieCategory = category }).Should().ContainSingle();
        }
    }
}
