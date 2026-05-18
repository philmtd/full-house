package logger

import (
	"fullhouse/pkg/fullhouse/config"
	"log/slog"
	"os"

	"github.com/lmittmann/tint"
	"github.com/mattn/go-isatty"
)

var rootLogger *slog.Logger

const LevelTrace = slog.Level(-8)

func init() {
	mode := config.Configuration.FullHouse.Mode
	var (
		handler slog.Handler
	)
	switch mode {
	case config.DEVELOPMENT:
		handler = tint.NewHandler(os.Stdout, &tint.Options{
			AddSource:   true,
			Level:       slog.LevelDebug,
			ReplaceAttr: nil,
			NoColor:     !isatty.IsTerminal(os.Stderr.Fd()),
		})
	case config.PRODUCTION:
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			AddSource: true,
			Level:     slog.LevelDebug,
		})
	default:
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
