package config

import (
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
	"strings"
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

func validateConfig(c Config) error {
	validate := validator.New()

	if err := validate.Struct(c); err != nil {
		return err
	}

	return nil
}

type Config struct {
	FullHouse GameConfig `yaml:"fullHouse"`
}

type GameConfig struct {
	Server        ServerConfig   `yaml:"server" validate:"required,dive"`
	Mode          Mode           `yaml:"mode"`
	VotingSchemes []VotingScheme `yaml:"votingSchemes" validate:"required,dive"`
}

type VotingScheme struct {
	Name                 string    `yaml:"name" json:"name" validate:"required"`
	Scheme               []float32 `yaml:"scheme" json:"scheme" validate:"required,dive,number,min=0"`
	IncludesQuestionmark bool      `yaml:"includesQuestionmark" json:"includesQuestionmark"`
}
type Mode string

const (
	DEVELOPMENT Mode = "development"
	PRODUCTION  Mode = "production"
)

type ServerConfig struct {
	Port int `yaml:"port" validate:"required,number"`
}
