package logger

import (
	"fullhouse/pkg/fullhouse/config"
	"github.com/lmittmann/tint"
	"github.com/mattn/go-isatty"
	"log/slog"
	"os"
)

var rootLogger *slog.Logger

func init() {
	mode := config.Configuration.FullHouse.Mode
	var (
		handler slog.Handler
	)
	if mode == config.DEVELOPMENT {
		handler = tint.NewHandler(os.Stdout, &tint.Options{
			AddSource:   true,
			Level:       slog.LevelDebug,
			ReplaceAttr: nil,
			NoColor:     !isatty.IsTerminal(os.Stderr.Fd()),
		})
	} else if mode == config.PRODUCTION {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			AddSource: true,
			Level:     slog.LevelDebug,
		})
	} else {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			AddSource: true,
			Level:     slog.LevelError,
		})
	}

	rootLogger = slog.New(handler)
}

func New(name string) *slog.Logger {
	return rootLogger.With(slog.String("logger", name))
}
