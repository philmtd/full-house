package banner

import (
	"bytes"
	"fmt"
	"github.com/dimiro1/banner"
	"io"
	"os"
)

func PrintBannerToWriter(writer io.Writer, color bool) {
	bannerFile, err := os.Open("./assets/banner.txt")
	if err == nil {
		banner.Init(writer, true, color, bannerFile)
	}
}

func GetBannerAsString() (string, error) {
	buf := new(bytes.Buffer)
	bannerFile, err := os.Open("./assets/banner.txt")
	if err != nil {
		return "", fmt.Errorf("failed to open banner")
	} else {
		banner.Init(buf, true, false, bannerFile)
		return buf.String(), nil
	}
}
