package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

var Configuration Config

func init() {
	Configuration = readInConfig()
}

func readInConfig() Config {
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config/")
	viper.AddConfigPath(".")
	viper.SetConfigName("fullhouse-default")
	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("failed to read in default config: %w", err))
	}

	viper.SetConfigName("fullhouse.yaml")

	if err := viper.MergeInConfig(); err != nil {
		if _, isConfigFileNotFoundError := err.(viper.ConfigFileNotFoundError); !isConfigFileNotFoundError {
			panic(fmt.Errorf("failed to read in config file: %w", err))
		}
	}

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	readConfig := Config{}
	if err := viper.Unmarshal(&readConfig); err != nil {
		panic(fmt.Errorf("failed to parse config: %w", err))
	}

	if err := validateConfig(readConfig); err != nil {
		panic(fmt.Errorf("config is invalid: %w", err))
	}

	return readConfig
}

type Config struct {
	FullHouse GameConfig `yaml:"fullHouse"`
}

type GameConfig struct {
	Server          ServerConfig           `yaml:"server" validate:"required"`
	Metrics         MetricsConfig          `yaml:"metrics" validate:"required"`
	Mode            Mode                   `yaml:"mode"`
	VotingSchemes   []VotingScheme         `yaml:"votingSchemes" validate:"required,dive"`
	PersistentGames []PersistentGameConfig `yaml:"persistentGames" validate:"dive"`
}

type VotingScheme struct {
	Name                 string                 `yaml:"name" json:"name" validate:"required"`
	Scheme               []float32              `yaml:"scheme" json:"scheme" validate:"required,dive,number,min=0"`
  Labels               []string               `yaml:"labels" json:"labels"`
	IncludesQuestionmark bool                   `yaml:"includesQuestionmark" json:"includesQuestionmark"`
	SchemeTooltipMapping []SchemeTooltipMapping `yaml:"schemeTooltipMapping" json:"schemeTooltipMapping"`
}

type SchemeTooltipMapping struct {
	Value   float32 `yaml:"value" json:"value"`
	Tooltip string  `yaml:"tooltip" json:"tooltip"`
}
type Mode string

const (
	DEVELOPMENT Mode = "development"
	PRODUCTION  Mode = "production"
)

type ServerConfig struct {
	Port         int  `yaml:"port" validate:"required,number"`
}

type MetricsConfig struct {
	Port int `yaml:"port" validate:"required,number"`
}

type PersistentGameConfig struct {
	Slug             string `yaml:"slug" validate:"required,lowercase,gameSlug,max=64"`
	Name             string `yaml:"name" validate:"required,max=64"`
	VotingSchemeName string `yaml:"votingSchemeName" validate:"required,votingSchemeName"`
}
