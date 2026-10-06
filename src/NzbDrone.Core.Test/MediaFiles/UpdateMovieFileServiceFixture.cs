using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using NzbDrone.Common.Disk;
using NzbDrone.Core.Configuration;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.MediaFiles.Events;
using NzbDrone.Core.Movies;
using NzbDrone.Core.Test.Framework;
using NzbDrone.Test.Common;

namespace NzbDrone.Core.Test.MediaFiles
{
    [TestFixture]
    public class UpdateMovieFileServiceFixture : CoreTest<UpdateMovieFileService>
    {
        private readonly DateTime _inCinemas = new DateTime(1999, 3, 31, 0, 0, 0, DateTimeKind.Utc);
        private Movie _movie;
        private MovieFile _movieFile;

        [SetUp]
        public void Setup()
        {
            _movie = Builder<Movie>.CreateNew()
                .With(m => m.Path = @"C:\Test\Movies\The Matrix (1999)".AsOsAgnostic())
                .With(m => m.MovieMetadata = new MovieMetadata { InCinemas = _inCinemas })
                .Build();

            _movieFile = Builder<MovieFile>.CreateNew()
                .With(f => f.RelativePath = "The Matrix (1999).mkv")
                .Build();

            Mocker.GetMock<IMediaFileService>()
                .Setup(s => s.GetFilesByMovie(_movie.Id))
                .Returns(new List<MovieFile> { _movieFile });

            Mocker.GetMock<IDiskProvider>()
                .Setup(s => s.FileGetLastWrite(It.IsAny<string>()))
                .Returns(new DateTime(2024, 1, 1));

            Mocker.GetMock<IDiskProvider>()
                .Setup(s => s.FolderExists(_movie.Path))
                .Returns(true);
        }

        private void GivenFileDate(FileDateType fileDate)
        {
            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.FileDate)
                .Returns(fileDate);
        }

        [Test]
        public void should_change_movie_folder_date_along_with_file_date()
        {
            GivenFileDate(FileDateType.Cinemas);

            Subject.Handle(new MovieScannedEvent(_movie, new List<string>()));

            Mocker.GetMock<IDiskProvider>()
                .Verify(v => v.FileSetLastWriteTime(It.IsAny<string>(), _inCinemas), Times.Once());

            Mocker.GetMock<IDiskProvider>()
                .Verify(v => v.FolderSetLastWriteTime(_movie.Path, _inCinemas), Times.Once());
        }

        [Test]
        public void should_not_change_folder_date_when_file_date_is_not_changed()
        {
            GivenFileDate(FileDateType.None);

            Subject.Handle(new MovieScannedEvent(_movie, new List<string>()));

            Mocker.GetMock<IDiskProvider>()
                .Verify(v => v.FolderSetLastWriteTime(It.IsAny<string>(), It.IsAny<DateTime>()), Times.Never());
        }

        [Test]
        public void should_not_change_folder_date_when_folder_is_missing()
        {
            GivenFileDate(FileDateType.Cinemas);

            Mocker.GetMock<IDiskProvider>()
                .Setup(s => s.FolderExists(_movie.Path))
                .Returns(false);

            Subject.Handle(new MovieScannedEvent(_movie, new List<string>()));

            Mocker.GetMock<IDiskProvider>()
                .Verify(v => v.FolderSetLastWriteTime(It.IsAny<string>(), It.IsAny<DateTime>()), Times.Never());
        }
    }
}
