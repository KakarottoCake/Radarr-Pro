using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NLog;
using NzbDrone.Common.Disk;
using NzbDrone.Common.Extensions;
using NzbDrone.Common.Instrumentation.Extensions;
using NzbDrone.Core.Configuration;
using NzbDrone.Core.MediaFiles.Events;
using NzbDrone.Core.Messaging.Events;
using NzbDrone.Core.Movies;

namespace NzbDrone.Core.MediaFiles
{
    public interface IUpdateMovieFileService
    {
        void ChangeFileDateForFile(MovieFile movieFile, Movie movie);
    }

    public class UpdateMovieFileService : IUpdateMovieFileService,
                                            IHandle<MovieScannedEvent>
    {
        private readonly IDiskProvider _diskProvider;
        private readonly IConfigService _configService;
        private readonly IMediaFileService _mediaFileService;
        private readonly Logger _logger;

        public UpdateMovieFileService(IDiskProvider diskProvider,
                                      IConfigService configService,
                                      IMediaFileService mediaFileService,
                                      Logger logger)
        {
            _diskProvider = diskProvider;
            _configService = configService;
            _mediaFileService = mediaFileService;
            _logger = logger;
        }

        public void ChangeFileDateForFile(MovieFile movieFile, Movie movie)
        {
            ChangeFileDate(movieFile, movie);
        }

        private bool ChangeFileDate(MovieFile movieFile, Movie movie)
        {
            var movieFilePath = Path.Combine(movie.Path, movieFile.RelativePath);

            switch (_configService.FileDate)
            {
                case FileDateType.Release:
                    {
                        var releaseDate = movie.MovieMetadata.Value.PhysicalRelease ?? movie.MovieMetadata.Value.DigitalRelease;

                        if (releaseDate.HasValue == false)
                        {
                            return false;
                        }

                        return ChangeFileDate(movieFilePath, releaseDate.Value, movie.Path);
                    }

                case FileDateType.Cinemas:
                    {
                        var airDate = movie.MovieMetadata.Value.InCinemas;

                        if (airDate.HasValue == false)
                        {
                            return false;
                        }

                        return ChangeFileDate(movieFilePath, airDate.Value, movie.Path);
                    }
            }

            return false;
        }

        private bool ChangeFileDate(string filePath, DateTime date)
        {
            if (DateTime.TryParse(_diskProvider.FileGetLastWrite(filePath).ToLongDateString(), out var oldDateTime))
            {
                if (!DateTime.Equals(date, oldDateTime))
                {
                    try
                    {
                        _diskProvider.FileSetLastWriteTime(filePath, date);
                        _logger.Debug("Date of file [{0}] changed from '{1}' to '{2}'", filePath, oldDateTime, date);

                        return true;
                    }
                    catch (Exception ex)
                    {
                        _logger.Warn(ex, "Unable to set date of file [" + filePath + "]");
                    }
                }
            }

            return false;
        }

        private bool ChangeFileDate(string filePath, DateTime date, string folderPath)
        {
            var changed = ChangeFileDate(filePath, date);

            ChangeFolderDate(folderPath, date);

            return changed;
        }

        // The movie folder follows its file so that sorting a library by folder date
        // matches the release date the same way sorting by file date does. The folder's
        // own timestamp cannot be read through the disk provider (it reports the newest
        // file inside), so it is simply set each time.
        private void ChangeFolderDate(string folderPath, DateTime date)
        {
            if (folderPath.IsNullOrWhiteSpace() || !_diskProvider.FolderExists(folderPath))
            {
                return;
            }

            try
            {
                _diskProvider.FolderSetLastWriteTime(folderPath, date);
                _logger.Trace("Date of folder [{0}] set to '{1}'", folderPath, date);
            }
            catch (Exception ex)
            {
                _logger.Warn(ex, "Unable to set date of folder [" + folderPath + "]");
            }
        }

        public void Handle(MovieScannedEvent message)
        {
            if (_configService.FileDate == FileDateType.None)
            {
                return;
            }

            var movieFiles = _mediaFileService.GetFilesByMovie(message.Movie.Id);
            var updated = new List<MovieFile>();

            foreach (var movieFile in movieFiles)
            {
                if (ChangeFileDate(movieFile, message.Movie))
                {
                    updated.Add(movieFile);
                }
            }

            if (updated.Any())
            {
                _logger.ProgressDebug("Changed file date for {0} files of {1} in {2}", updated.Count, movieFiles.Count, message.Movie.Title);
            }
            else
            {
                _logger.ProgressDebug("No file dates changed for {0}", message.Movie.Title);
            }
        }
    }
}
