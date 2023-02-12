//go:build mage

package main

import (
	"bytes"
	"fmt"
	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"
	"os"
	"os/exec"
	"strings"
)

const (
	commandName    = "full-house"
	commandPackage = "fullhouse/cmd/fullhouse"
	testCmd        = "gotestsum"
	lintCmd        = "golangci-lint"
)

var (
	Default = Deps
)

func Test() error {
	return sh.RunV("go", "test", "-v", "./pkg/...", "-coverprofile", "cover.out")
}

func TestCi() error {
	return sh.RunV(testCmd, "--format", "testname", "--junitfile", "test_results.xml", "--", "-v", "./pkg/...", "-coverprofile", "cover.out")
}

func Lint() error {
	return lint(false)
}

func LintCi() error {
	return lint(true)
}

func lint(writeToFile bool) error {
	if !verify() {
		mg.Deps(Deps)
	}
	args := []string{
		"run",
		"-v",
	}
	if writeToFile {
		args = append(args, "--out-format=junit-xml")
	}

	output, _ := sh.Output(lintCmd, args...)

	if writeToFile {
		return writeFile("linter_results.xml", output)
	} else {
		fmt.Println(output)
	}

	return nil
}

func Build() error {
	return build(make(map[string]string))
}

func BuildForDocker() error {
	env := map[string]string{
		"CGO_ENABLED": "0",
		"GOOS":        "linux",
	}
	return build(env)
}

func Docker() error {
	mg.Deps(BuildForDocker)
	fmt.Println("Building container image")
	return sh.RunV("docker", "build", "-t", "philmtd/full-house", ".")
}

func build(env map[string]string) error {
	fmt.Println("Building project")
	buildflags := []string{
		"-installsuffix", "cgo", "--tags", "release",
	}

	arguments := []string{
		"build",
		"-o",
		commandName,
		"-a",
	}
	arguments = append(arguments, buildflags...)
	arguments = append(arguments, "-ldflags="+ldflags(), commandPackage)
	return sh.RunWithV(env, "go", arguments...)
}

func ldflags() string {
	return fmt.Sprintf(`-extldflags -static -s -w -X=main.GitTag=%s -X=main.GitCommit=%s`, gitTag(), gitCommitHash())
}

func gitCommitHash() string {
	hash, _ := sh.Output("git", "rev-parse", "--short", "HEAD")
	return strings.TrimSpace(hash)
}

func gitTag() string {
	tag, err := sh.Output("git", "tag", "--points-at", "HEAD")
	if err != nil {
		return "dev"
	}

	return strings.TrimSpace(tag)
}

func Outdated() error {
	modOutdated := exec.Command("go-mod-outdated", "-update", "-direct")
	modList, err := sh.Output("go", "list", "-u", "-m", "-json", "all")
	if err != nil {
		return err
	}
	modOutdated.Stdin = bytes.NewBufferString(modList)
	modOutdated.Stdout = os.Stdout
	return modOutdated.Run()
}

func verify() bool {
	return sh.CmdRan(sh.RunV("go", "mod", "verify"))
}

func Deps() {
	fmt.Println("Running go mod download and go mod tidy...")
	mg.SerialDeps(ModDownload, ModTidy)
}

func ModDownload() error {
	return sh.RunV("go", "mod", "download")
}

func ModTidy() error {
	return sh.RunV("go", "mod", "tidy")
}

func Clean() error {
	fmt.Println("Cleaning...")
	filesToRemove := []string{
		commandName,
		"cover.out",
		"linter_results.xml",
		"test_results.xml",
	}
	for _, file := range filesToRemove {
		if err := sh.Rm(file); err != nil {
			return err
		}
	}
	return nil
}

func writeFile(filename, content string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.WriteString(content)
	return err
}
