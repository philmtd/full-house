package config

import (
	"github.com/go-playground/validator/v10"
	"regexp"
)

func validateConfig(c Config) error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	if err := validate.RegisterValidation("votingSchemeName", validateVotingSchemeName); err != nil {
		return err
	}
	if err := validate.RegisterValidation("gameSlug", validateSlug); err != nil {
		return err
	}
	if err := validate.Struct(c); err != nil {
		return err
	}

	return nil
}
func validateVotingSchemeName(fl validator.FieldLevel) bool {
	cfg := fl.Top().Interface().(Config)
	for _, scheme := range cfg.FullHouse.VotingSchemes {
		if scheme.Name == fl.Field().String() {
			return true
		}
	}
	return false
}

func validateSlug(fl validator.FieldLevel) bool {
	regex := regexp.MustCompile(`^[a-z]+([-_]*[a-z]+)$`)
	slug := fl.Field().String()
	return regex.MatchString(slug)
}
