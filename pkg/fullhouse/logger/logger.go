package logger

import (
	"fmt"
	"fullhouse/pkg/fullhouse/config"
	"go.uber.org/zap"
)

var rootLogger *zap.SugaredLogger

func init() {
	mode := config.Configuration.FullHouse.Mode
	var (
		logger *zap.Logger
		err    error
	)
	if mode == config.DEVELOPMENT {
		logger, err = zap.NewDevelopment(zap.AddCaller(), zap.AddCallerSkip(1))
	} else if mode == config.PRODUCTION {
		logger, err = zap.NewProduction(zap.AddCaller(), zap.AddCallerSkip(1))
	} else {
		logger = zap.NewNop()
	}

	if err != nil {
		panic(fmt.Sprintf("failed to setup logging: %v", err))
	}

	rootLogger = logger.Sugar()
}

func New(name string) *zap.SugaredLogger {
	return rootLogger.Named(name)
}

func Root() *zap.SugaredLogger {
	return rootLogger
}
