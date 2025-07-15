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
		panic(fmt.Errorf("failed to read in default config: %w \n", err))
	}

	viper.SetConfigName("fullhouse.yaml")

	if err := viper.MergeInConfig(); err != nil {
		if _, isConfigFileNotFoundError := err.(viper.ConfigFileNotFoundError); !isConfigFileNotFoundError {
			panic(fmt.Errorf("failed to read in config file: %w \n", err))
		}
	}

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	readConfig := Config{}
	if err := viper.Unmarshal(&readConfig); err != nil {
		panic(fmt.Errorf("failed to parse config: %w \n", err))
	}

	if err := validateConfig(readConfig); err != nil {
		panic(fmt.Errorf("config is invalid: %w \n", err))
	}

	return readConfig
}

type Config struct {
	FullHouse GameConfig `yaml:"fullHouse"`
}

type GameConfig struct {
	Server             ServerConfig           `yaml:"server" validate:"required"`
	Metrics            MetricsConfig          `yaml:"metrics" validate:"required"`
	Mode               Mode                   `yaml:"mode"`
	VotingSchemes      []VotingScheme         `yaml:"votingSchemes" validate:"required,dive"`
	PersistentGames    []PersistentGameConfig `yaml:"persistentGames" validate:"dive"`
	StoryPointsMapping []StoryPointMapping    `yaml:"storyPointsMapping" json:"storyPointsMapping"`
}

type VotingScheme struct {
	Name                 string    `yaml:"name" json:"name"`
	Scheme               []float32 `yaml:"scheme" json:"scheme"`
	IncludesQuestionmark bool      `yaml:"includesQuestionmark" json:"includesQuestionmark"`
}

// StoryPointMapping allows customizing the value/description pairs for story points.
type StoryPointMapping struct {
	Value       float64 `yaml:"value" json:"value"`
	Description string  `yaml:"description" json:"description"`
}
type Mode string

const (
	DEVELOPMENT Mode = "development"
	PRODUCTION  Mode = "production"
)

type ServerConfig struct {
	Port         int  `yaml:"port" validate:"required,number"`
	CookieSecure bool `yaml:"cookieSecure"`
}

type MetricsConfig struct {
	Port int `yaml:"port" validate:"required,number"`
}

type PersistentGameConfig struct {
	Slug             string `yaml:"slug" validate:"required,lowercase,gameSlug,max=64"`
	Name             string `yaml:"name" validate:"required,max=64"`
	VotingSchemeName string `yaml:"votingSchemeName" validate:"required,votingSchemeName"`
}
