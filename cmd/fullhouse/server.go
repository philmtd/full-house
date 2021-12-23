package main

import (
	"context"
	"fullhouse/pkg/fullhouse/banner"
	"fullhouse/pkg/fullhouse/config"
	"fullhouse/pkg/fullhouse/server"
	"github.com/spf13/cobra"
)

var serverCmd *cobra.Command

func init() {
	serverCmd = &cobra.Command{
		Use:   "server [flags]",
		Short: "starts the game server",
		Run: func(cmd *cobra.Command, args []string) {
			banner.PrintBannerToWriter(cmd.OutOrStdout(), false)
			rootCtx, cancel := context.WithCancel(context.Background())
			defer cancel()
			s := server.New(rootCtx, GetVersion())
			s.Start(config.Configuration)
		},
	}
	rootCmd.AddCommand(serverCmd)
}
