package main

import (
	"flag"
	"fmt"
	"fullhouse/pkg/fullhouse/logger"
	"github.com/spf13/cobra"
	"log/slog"
	"os"
)

var log = logger.New("full-house")
var rootCmd *cobra.Command

var GitCommit = ""
var GitTag = ""
var commandVersion string

func init() {
	longDescription := ""
	longDescription += "Full House is a planning poker tool to help teams estimate the time required to get tasks done."

	if len(GitTag) == 0 && len(GitCommit) == 0 {
		commandVersion = "dev"
	} else if len(GitTag) == 0 {
		commandVersion = GitCommit
	} else {
		commandVersion = fmt.Sprintf("%s (%s)", GitTag, GitCommit)
	}
	rootCmd = &cobra.Command{
		Use:          "full-house [flags]",
		Short:        "Full House is a planning poker tool.",
		Long:         longDescription,
		SilenceUsage: true,
		Version:      commandVersion,
	}
	flags := rootCmd.PersistentFlags()
	flags.AddGoFlagSet(flag.CommandLine)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		log.Error("command failed", slog.Any("error", err))
		os.Exit(1)
	}
}

func GetVersion() string {
	return commandVersion
}
