// @ts-nocheck -- captured against a newer tscircuit version than this repo uses
export default () => (
  <board width="220mm" height="150mm" schematicDisabled>
    {/* soc */}
    <chip
      name="soc_U1"
      footprint="bga529"
      pinLabels={{
        pin1: "VDD_ARM_1",
        pin2: "VDD_ARM_2",
        pin3: "VDD_ARM_3",
        pin4: "VDD_SOC_1",
        pin5: "VDD_SOC_2",
        pin6: "VDD_SOC_3",
        pin7: "VDD_DRAM_1",
        pin8: "VDD_DRAM_2",
        pin9: "VDD_DRAM_3",
        pin10: "VDD_1V8_1",
        pin11: "VDD_1V8_2",
        pin12: "VDD_1V8_3",
        pin13: "VDD_3V3_1",
        pin14: "VDD_3V3_2",
        pin15: "VDD_3V3_3",
        pin16: "GND_1",
        pin17: "GND_2",
        pin18: "GND_3",
        pin19: "GND_4",
        pin20: "GND_5",
        pin21: "DDR_DQ0",
        pin22: "DDR_DQ1",
        pin23: "DDR_DQ2",
        pin24: "DDR_DQ3",
        pin25: "DDR_DQ4",
        pin26: "DDR_DQ5",
        pin27: "DDR_DQ6",
        pin28: "DDR_DQ7",
        pin29: "DDR_DQ8",
        pin30: "DDR_DQ9",
        pin31: "DDR_DQ10",
        pin32: "DDR_DQ11",
        pin33: "DDR_DQ12",
        pin34: "DDR_DQ13",
        pin35: "DDR_DQ14",
        pin36: "DDR_DQ15",
        pin37: "DDR_A0",
        pin38: "DDR_A1",
        pin39: "DDR_A2",
        pin40: "DDR_A3",
        pin41: "DDR_A4",
        pin42: "DDR_A5",
        pin43: "DDR_A6",
        pin44: "DDR_A7",
        pin45: "DDR_A8",
        pin46: "DDR_A9",
        pin47: "DDR_CK_P",
        pin48: "DDR_CK_N",
        pin49: "DDR_CKE",
        pin50: "DDR_CS_N",
        pin51: "DDR_RAS_N",
        pin52: "DDR_CAS_N",
        pin53: "DDR_WE_N",
        pin54: "EMMC_CLK",
        pin55: "EMMC_CMD",
        pin56: "EMMC_RESET_N",
        pin57: "EMMC_DAT0",
        pin58: "EMMC_DAT1",
        pin59: "EMMC_DAT2",
        pin60: "EMMC_DAT3",
        pin61: "EMMC_DAT4",
        pin62: "EMMC_DAT5",
        pin63: "EMMC_DAT6",
        pin64: "EMMC_DAT7",
        pin65: "RGMII_TXC",
        pin66: "RGMII_TXCTL",
        pin67: "RGMII_RXC",
        pin68: "RGMII_RXCTL",
        pin69: "RGMII_TXD0",
        pin70: "RGMII_TXD1",
        pin71: "RGMII_TXD2",
        pin72: "RGMII_TXD3",
        pin73: "RGMII_RXD0",
        pin74: "RGMII_RXD1",
        pin75: "RGMII_RXD2",
        pin76: "RGMII_RXD3",
        pin77: "I2C1_SCL",
        pin78: "I2C1_SDA",
        pin79: "UART1_TXD",
        pin80: "UART1_RXD",
        pin81: "SOC_RESET_N",
        pin82: "PWRON",
        pin83: "BOOT_MODE0",
        pin84: "BOOT_MODE1",
        pin85: "JTAG_TCK",
        pin86: "JTAG_TMS",
        pin87: "JTAG_TDI",
        pin88: "JTAG_TDO",
        pin89: "USB1_DP",
        pin90: "USB1_DN",
        pin91: "HDMI_TX0_P",
        pin92: "HDMI_TX0_N",
        pin93: "SAI_MCLK",
        pin94: "SAI_BCLK",
        pin95: "SAI_LRCLK",
        pin96: "SAI_TXD",
        pin97: "SAI_RXD",
        pin98: "XTAL_24M_IN",
        pin99: "XTAL_24M_OUT",
      }}
      connections={{
        pin1: "net.VDD_ARM_0V85",
        pin2: "net.VDD_ARM_0V85",
        pin3: "net.VDD_ARM_0V85",
        pin4: "net.VDD_SOC_0V85",
        pin5: "net.VDD_SOC_0V85",
        pin6: "net.VDD_SOC_0V85",
        pin7: "net.VDD_DRAM_1V1",
        pin8: "net.VDD_DRAM_1V1",
        pin9: "net.VDD_DRAM_1V1",
        pin10: "net.VDD_1V8",
        pin11: "net.VDD_1V8",
        pin12: "net.VDD_1V8",
        pin13: "net.VDD_3V3",
        pin14: "net.VDD_3V3",
        pin15: "net.VDD_3V3",
        pin16: "net.GND",
        pin17: "net.GND",
        pin18: "net.GND",
        pin19: "net.GND",
        pin20: "net.GND",
        pin21: "net.DDR_DQ0",
        pin22: "net.DDR_DQ1",
        pin23: "net.DDR_DQ2",
        pin24: "net.DDR_DQ3",
        pin25: "net.DDR_DQ4",
        pin26: "net.DDR_DQ5",
        pin27: "net.DDR_DQ6",
        pin28: "net.DDR_DQ7",
        pin29: "net.DDR_DQ8",
        pin30: "net.DDR_DQ9",
        pin31: "net.DDR_DQ10",
        pin32: "net.DDR_DQ11",
        pin33: "net.DDR_DQ12",
        pin34: "net.DDR_DQ13",
        pin35: "net.DDR_DQ14",
        pin36: "net.DDR_DQ15",
        pin37: "net.DDR_A0",
        pin38: "net.DDR_A1",
        pin39: "net.DDR_A2",
        pin40: "net.DDR_A3",
        pin41: "net.DDR_A4",
        pin42: "net.DDR_A5",
        pin43: "net.DDR_A6",
        pin44: "net.DDR_A7",
        pin45: "net.DDR_A8",
        pin46: "net.DDR_A9",
        pin47: "net.DDR_CK_P",
        pin48: "net.DDR_CK_N",
        pin49: "net.DDR_CKE",
        pin50: "net.DDR_CS_N",
        pin51: "net.DDR_RAS_N",
        pin52: "net.DDR_CAS_N",
        pin53: "net.DDR_WE_N",
        pin54: "net.EMMC_CLK",
        pin55: "net.EMMC_CMD",
        pin56: "net.EMMC_RESET_N",
        pin57: "net.EMMC_DAT0",
        pin58: "net.EMMC_DAT1",
        pin59: "net.EMMC_DAT2",
        pin60: "net.EMMC_DAT3",
        pin61: "net.EMMC_DAT4",
        pin62: "net.EMMC_DAT5",
        pin63: "net.EMMC_DAT6",
        pin64: "net.EMMC_DAT7",
        pin65: "net.RGMII_TXC",
        pin66: "net.RGMII_TXCTL",
        pin67: "net.RGMII_RXC",
        pin68: "net.RGMII_RXCTL",
        pin69: "net.RGMII_TXD0",
        pin70: "net.RGMII_TXD1",
        pin71: "net.RGMII_TXD2",
        pin72: "net.RGMII_TXD3",
        pin73: "net.RGMII_RXD0",
        pin74: "net.RGMII_RXD1",
        pin75: "net.RGMII_RXD2",
        pin76: "net.RGMII_RXD3",
        pin77: "net.I2C1_SCL",
        pin78: "net.I2C1_SDA",
        pin79: "net.UART1_TXD",
        pin80: "net.UART1_RXD",
        pin81: "net.SOC_RESET_N",
        pin82: "net.PWRON",
        pin83: "net.BOOT_MODE0",
        pin84: "net.BOOT_MODE1",
        pin85: "net.JTAG_TCK",
        pin86: "net.JTAG_TMS",
        pin87: "net.JTAG_TDI",
        pin88: "net.JTAG_TDO",
        pin89: "net.USB1_DP",
        pin90: "net.USB1_DN",
        pin91: "net.HDMI_TX0_P",
        pin92: "net.HDMI_TX0_N",
        pin93: "net.SAI_MCLK",
        pin94: "net.SAI_BCLK",
        pin95: "net.SAI_LRCLK",
        pin96: "net.SAI_TXD",
        pin97: "net.SAI_RXD",
        pin98: "net.XTAL_24M_IN",
        pin99: "net.XTAL_24M_OUT",
      }}
    />

    {/* socdecoup */}
    <capacitor
      name="socdecoup_C1"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C2"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C3"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C4"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C5"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C6"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C7"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C8"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />

    <capacitor
      name="socdecoup_C9"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C10"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C11"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C12"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C13"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C14"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C15"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C16"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />

    <capacitor
      name="socdecoup_C17"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C18"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C19"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C20"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C21"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C22"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C23"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C24"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C25"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C26"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />

    <capacitor
      name="socdecoup_C27"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C28"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C29"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C30"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C31"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C32"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C33"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C34"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />

    <capacitor
      name="socdecoup_C35"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C36"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C37"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C38"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C39"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="socdecoup_C40"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />

    {/* xtal24 */}
    <crystal
      name="xtal24_Y1"
      frequency="24MHz"
      loadCapacitance="12pF"
      footprint="hc49"
      connections={{
        pin1: "net.XTAL_24M_IN",
        pin2: "net.XTAL_24M_OUT",
      }}
    />
    <capacitor
      name="xtal24_C1"
      capacitance="12pF"
      footprint="0402"
      connections={{
        pin1: "net.XTAL_24M_IN",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="xtal24_C2"
      capacitance="12pF"
      footprint="0402"
      connections={{
        pin1: "net.XTAL_24M_OUT",
        pin2: "net.GND",
      }}
    />

    {/* rtcxtal */}
    <crystal
      name="rtcxtal_Y1"
      footprint="hc49"
      frequency="32.768kHz"
      loadCapacitance="12pF"
      connections={{
        pin1: "net.XTAL_32K_IN",
        pin2: "net.XTAL_32K_OUT",
      }}
    />
    <capacitor
      name="rtcxtal_C1"
      footprint="0402"
      capacitance="12pF"
      connections={{
        pin1: "net.XTAL_32K_IN",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="rtcxtal_C2"
      footprint="0402"
      capacitance="12pF"
      connections={{
        pin1: "net.XTAL_32K_OUT",
        pin2: "net.GND",
      }}
    />

    {/* ddr */}
    <chip
      name="ddr_U1"
      footprint="bga200"
      manufacturerPartNumber="MT53E1G16D16GBx16LPDDR4"
      pinLabels={{
        "1": "DQ0",
        "2": "DQ1",
        "3": "DQ2",
        "4": "DQ3",
        "5": "DQ4",
        "6": "DQ5",
        "7": "DQ6",
        "8": "DQ7",
        "9": "DQ8",
        "10": "DQ9",
        "11": "DQ10",
        "12": "DQ11",
        "13": "DQ12",
        "14": "DQ13",
        "15": "DQ14",
        "16": "DQ15",
        "17": "A0",
        "18": "A1",
        "19": "A2",
        "20": "A3",
        "21": "A4",
        "22": "A5",
        "23": "A6",
        "24": "A7",
        "25": "A8",
        "26": "A9",
        "27": "CK_P",
        "28": "CK_N",
        "29": "CKE",
        "30": "CS_N",
        "31": "RAS_N",
        "32": "CAS_N",
        "33": "WE_N",
        "34": "VDD2_1",
        "35": "VDD2_2",
        "36": "VDD2_3",
        "37": "VDDQ_1",
        "38": "VDDQ_2",
        "39": "VDDQ_3",
        "40": "VSS_1",
        "41": "VSS_2",
        "42": "VSS_3",
        "43": "VSS_4",
        "44": "VSS_5",
      }}
      connections={{
        DQ0: "net.DDR_DQ0",
        DQ1: "net.DDR_DQ1",
        DQ2: "net.DDR_DQ2",
        DQ3: "net.DDR_DQ3",
        DQ4: "net.DDR_DQ4",
        DQ5: "net.DDR_DQ5",
        DQ6: "net.DDR_DQ6",
        DQ7: "net.DDR_DQ7",
        DQ8: "net.DDR_DQ8",
        DQ9: "net.DDR_DQ9",
        DQ10: "net.DDR_DQ10",
        DQ11: "net.DDR_DQ11",
        DQ12: "net.DDR_DQ12",
        DQ13: "net.DDR_DQ13",
        DQ14: "net.DDR_DQ14",
        DQ15: "net.DDR_DQ15",
        A0: "net.DDR_A0",
        A1: "net.DDR_A1",
        A2: "net.DDR_A2",
        A3: "net.DDR_A3",
        A4: "net.DDR_A4",
        A5: "net.DDR_A5",
        A6: "net.DDR_A6",
        A7: "net.DDR_A7",
        A8: "net.DDR_A8",
        A9: "net.DDR_A9",
        CK_P: "net.DDR_CK_P",
        CK_N: "net.DDR_CK_N",
        CKE: "net.DDR_CKE",
        CS_N: "net.DDR_CS_N",
        RAS_N: "net.DDR_RAS_N",
        CAS_N: "net.DDR_CAS_N",
        WE_N: "net.DDR_WE_N",
        VDD2_1: "net.VDD_DRAM_1V1",
        VDD2_2: "net.VDD_DRAM_1V1",
        VDD2_3: "net.VDD_DRAM_1V1",
        VDDQ_1: "net.VDD_DRAM_0V6",
        VDDQ_2: "net.VDD_DRAM_0V6",
        VDDQ_3: "net.VDD_DRAM_0V6",
        VSS_1: "net.GND",
        VSS_2: "net.GND",
        VSS_3: "net.GND",
        VSS_4: "net.GND",
        VSS_5: "net.GND",
      }}
    />

    {/* ddrterm */}
    <resistor
      name="ddrterm_R1"
      footprint="0402"
      resistance="10k"
      tolerance="1%"
      connections={{
        pin1: "net.VDD_DRAM_1V1",
        pin2: "net.DDR_VREF",
      }}
    />
    <resistor
      name="ddrterm_R2"
      footprint="0402"
      resistance="12k"
      tolerance="1%"
      connections={{
        pin1: "net.DDR_VREF",
        pin2: "net.GND",
      }}
    />
    <resistor
      name="ddrterm_R3"
      footprint="0402"
      resistance="240"
      tolerance="1%"
      connections={{
        pin1: "net.VDD_DRAM_0V6",
        pin2: "net.GND",
      }}
    />

    {/* ddrdecoup */}
    <capacitor
      name="ddrdecoup_C1"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="ddrdecoup_C2"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="ddrdecoup_C3"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="ddrdecoup_C4"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_0V6", pin2: "net.GND" }}
    />
    <capacitor
      name="ddrdecoup_C5"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_0V6", pin2: "net.GND" }}
    />
    <capacitor
      name="ddrdecoup_C6"
      footprint="0402"
      capacitance="1uF"
      connections={{ pin1: "net.VDD_DRAM_0V6", pin2: "net.GND" }}
    />

    {/* emmc */}
    {/* <chip
        name="emmc_U1" 
        footprint="bga153"
        connections={{
          ...Object.fromEntries(
            Array.from({ length: 153 }, (_, index) => [`pin${index + 1}`, "net.GND"]),
          ),
          pin1: "net.VDD_3V3",
          pin2: "net.VDD_1V8",
          pin3: "net.EMMC_CLK",
          pin4: "net.EMMC_CMD",
          pin5: "net.EMMC_RESET_N",
          pin6: "net.EMMC_DAT0",
          pin7: "net.EMMC_DAT1",
          pin8: "net.EMMC_DAT2",
          pin9: "net.EMMC_DAT3",
          pin10: "net.EMMC_DAT4",
          pin11: "net.EMMC_DAT5",
          pin12: "net.EMMC_DAT6",
          pin13: "net.EMMC_DAT7",
        }}
      /> */}

    {/* pmic */}
    <chip
      name="pmic_U1"
      footprint="qfn68"
      connections={{
        pin1: "net.SYS_5V",
        pin2: "net.SYS_5V",
        pin3: "net.SYS_5V",
        pin4: "net.GND",
        pin5: "net.GND",
        pin6: "net.GND",
        pin7: "net.pmic_PMIC_BUCK_ARM_SW",
        pin8: "net.pmic_PMIC_BUCK_ARM_SW",
        pin9: "net.pmic_PMIC_BUCK_SOC_SW",
        pin10: "net.pmic_PMIC_BUCK_SOC_SW",
        pin11: "net.pmic_PMIC_BUCK_DRAM_SW",
        pin12: "net.pmic_PMIC_BUCK_DRAM_SW",
        pin13: "net.pmic_PMIC_BUCK_1V8_SW",
        pin14: "net.pmic_PMIC_BUCK_1V8_SW",
        pin15: "net.pmic_PMIC_BUCK_3V3_SW",
        pin16: "net.pmic_PMIC_BUCK_3V3_SW",
        pin17: "net.VDD_ARM_0V85",
        pin18: "net.VDD_SOC_0V85",
        pin19: "net.VDD_DRAM_1V1",
        pin20: "net.VDD_1V8",
        pin21: "net.VDD_3V3",
        pin22: "net.GND",
        pin23: "net.GND",
        pin24: "net.GND",
        pin25: "net.GND",
        pin26: "net.GND",
        pin27: "net.GND",
        pin28: "net.GND",
        pin29: "net.GND",
        pin30: "net.GND",
        pin31: "net.GND",
        pin32: "net.GND",
        pin33: "net.GND",
        pin34: "net.GND",
        pin35: "net.I2C1_SCL",
        pin36: "net.I2C1_SDA",
        pin37: "net.PMIC_IRQ",
        pin38: "net.PMIC_PG",
        pin39: "net.PWRON",
        pin40: "net.VDD_3V3",
        pin41: "net.VDD_1V8",
        pin42: "net.GND",
        pin43: "net.GND",
        pin44: "net.GND",
        pin45: "net.GND",
        pin46: "net.GND",
        pin47: "net.GND",
        pin48: "net.GND",
        pin49: "net.GND",
        pin50: "net.GND",
        pin51: "net.GND",
        pin52: "net.GND",
        pin53: "net.GND",
        pin54: "net.GND",
        pin55: "net.GND",
        pin56: "net.GND",
        pin57: "net.GND",
        pin58: "net.GND",
        pin59: "net.GND",
        pin60: "net.GND",
        pin61: "net.GND",
        pin62: "net.GND",
        pin63: "net.GND",
        pin64: "net.GND",
        pin65: "net.GND",
        pin66: "net.GND",
        pin67: "net.GND",
        pin68: "net.GND",
      }}
    />

    <capacitor
      name="pmic_C1"
      footprint="0805"
      capacitance="10uF"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C2"
      footprint="0805"
      capacitance="10uF"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />

    <inductor
      name="pmic_L1"
      footprint="0805"
      inductance="2.2uH"
      connections={{
        pin1: "net.pmic_PMIC_BUCK_ARM_SW",
        pin2: "net.VDD_ARM_0V85",
      }}
    />
    <capacitor
      name="pmic_C3"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C4"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_ARM_0V85", pin2: "net.GND" }}
    />

    <inductor
      name="pmic_L2"
      footprint="0805"
      inductance="2.2uH"
      connections={{
        pin1: "net.pmic_PMIC_BUCK_SOC_SW",
        pin2: "net.VDD_SOC_0V85",
      }}
    />
    <capacitor
      name="pmic_C5"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C6"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_SOC_0V85", pin2: "net.GND" }}
    />

    <inductor
      name="pmic_L3"
      footprint="0805"
      inductance="2.2uH"
      connections={{
        pin1: "net.pmic_PMIC_BUCK_DRAM_SW",
        pin2: "net.VDD_DRAM_1V1",
      }}
    />
    <capacitor
      name="pmic_C7"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C8"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_DRAM_1V1", pin2: "net.GND" }}
    />

    <inductor
      name="pmic_L4"
      footprint="0805"
      inductance="2.2uH"
      connections={{ pin1: "net.pmic_PMIC_BUCK_1V8_SW", pin2: "net.VDD_1V8" }}
    />
    <capacitor
      name="pmic_C9"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C10"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />

    <inductor
      name="pmic_L5"
      footprint="0805"
      inductance="2.2uH"
      connections={{ pin1: "net.pmic_PMIC_BUCK_3V3_SW", pin2: "net.VDD_3V3" }}
    />
    <capacitor
      name="pmic_C11"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="pmic_C12"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />

    <resistor
      name="pmic_R1"
      footprint="0402"
      resistance="2.2kΩ"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.I2C1_SCL" }}
    />
    <resistor
      name="pmic_R2"
      footprint="0402"
      resistance="2.2kΩ"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.I2C1_SDA" }}
    />
    <resistor
      name="pmic_R3"
      footprint="0402"
      resistance="4.7kΩ"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.PMIC_IRQ" }}
    />
    <resistor
      name="pmic_R4"
      footprint="0402"
      resistance="4.7kΩ"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.PMIC_PG" }}
    />
    <resistor
      name="pmic_R5"
      footprint="0402"
      resistance="100kΩ"
      connections={{ pin1: "net.PWRON", pin2: "net.GND" }}
    />

    {/* usbcpd */}
    <chip
      name="usbcpd_J1"
      footprint="qfn32"
      pinLabels={{
        pin1: "GND_A1",
        pin2: "VBUS_A4",
        pin3: "CC1",
        pin4: "DP_A6",
        pin5: "DN_A7",
        pin6: "SBU1",
        pin7: "VBUS_A9",
        pin8: "GND_A12",
        pin9: "GND_B1",
        pin10: "VBUS_B4",
        pin11: "CC2",
        pin12: "DP_B6",
        pin13: "DN_B7",
        pin14: "SBU2",
        pin15: "VBUS_B9",
        pin16: "GND_B12",
        pin17: "SHELL",
      }}
      connections={{
        GND_A1: "net.GND",
        VBUS_A4: "net.USB_VBUS",
        CC1: "net.PD_CC1",
        DP_A6: "net.USB1_DP",
        DN_A7: "net.USB1_DN",
        VBUS_A9: "net.USB_VBUS",
        GND_A12: "net.GND",
        GND_B1: "net.GND",
        VBUS_B4: "net.USB_VBUS",
        CC2: "net.PD_CC2",
        DP_B6: "net.USB1_DP",
        DN_B7: "net.USB1_DN",
        VBUS_B9: "net.USB_VBUS",
        GND_B12: "net.GND",
        SHELL: "net.GND",
      }}
    />

    <resistor
      name="usbcpd_R1"
      footprint="0402"
      resistance="5.1k"
      connections={{
        pin1: "net.PD_CC1",
        pin2: "net.GND",
      }}
    />

    <resistor
      name="usbcpd_R2"
      footprint="0402"
      resistance="5.1k"
      connections={{
        pin1: "net.PD_CC2",
        pin2: "net.GND",
      }}
    />

    <chip
      name="usbcpd_U1"
      footprint="qfn32"
      pinLabels={{
        pin1: "CC1",
        pin2: "CC2",
        pin3: "VBUS",
        pin4: "GND",
      }}
      connections={{
        CC1: "net.PD_CC1",
        CC2: "net.PD_CC2",
        VBUS: "net.USB_VBUS",
        GND: "net.GND",
      }}
    />

    <chip
      name="usbcpd_U2"
      footprint="sot23_5"
      pinLabels={{
        pin1: "USB_DP",
        pin2: "USB_DN",
        pin3: "CC1",
        pin4: "CC2",
        pin5: "GND",
      }}
      connections={{
        USB_DP: "net.USB1_DP",
        USB_DN: "net.USB1_DN",
        CC1: "net.PD_CC1",
        CC2: "net.PD_CC2",
        GND: "net.GND",
      }}
    />

    <chip
      name="usbcpd_D1"
      footprint="sod123"
      pinLabels={{
        pin1: "A",
        pin2: "K",
      }}
      connections={{
        A: "net.GND",
        K: "net.USB_VBUS",
      }}
    />

    {/* inprot */}
    <chip
      name="inprot_U1"
      footprint="sot23_3"
      connections={{
        pin1: "net.inprot_PMOS_GATE",
        pin2: "net.USB_VBUS",
        pin3: "net.SYS_5V",
      }}
    />
    <resistor
      name="inprot_R1"
      resistance="100k"
      footprint="0402"
      connections={{
        pin1: "net.inprot_PMOS_GATE",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="inprot_C1"
      capacitance="100nF"
      footprint="0402"
      connections={{
        pin1: "net.USB_VBUS",
        pin2: "net.inprot_PMOS_GATE",
      }}
    />

    {/* buck33 */}
    <chip
      name="buck33_U1"
      footprint="qfn16"
      manufacturerPartNumber="TPS62130RGTR"
      pinLabels={{
        pin1: "SW",
        pin2: "SW",
        pin3: "PGND",
        pin4: "PGND",
        pin5: "AGND",
        pin6: "FB",
        pin7: "PG",
        pin8: "EN",
        pin9: "SS_TR",
        pin10: "VOS",
        pin11: "AVIN",
        pin12: "VIN",
        pin13: "VIN",
        pin14: "NC",
        pin15: "NC",
        pin16: "NC",
        pin17: "THERMAL_PAD",
      }}
      connections={{
        pin1: "net.buck33_buck33_SW",
        pin2: "net.buck33_buck33_SW",
        pin3: "net.GND",
        pin4: "net.GND",
        pin5: "net.GND",
        pin6: "net.buck33_buck33_FB",
        pin8: "net.SYS_5V",
        pin9: "net.buck33_buck33_SS",
        pin10: "net.VDD_3V3",
        pin11: "net.SYS_5V",
        pin12: "net.SYS_5V",
        pin13: "net.SYS_5V",
      }}
    />

    <capacitor
      name="buck33_C1"
      footprint="0805"
      capacitance="10uF"
      maxVoltageRating="10V"
      connections={{
        pin1: "net.SYS_5V",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="buck33_C2"
      footprint="0805"
      capacitance="10uF"
      maxVoltageRating="10V"
      connections={{
        pin1: "net.SYS_5V",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="buck33_C3"
      footprint="0402"
      capacitance="100nF"
      maxVoltageRating="16V"
      connections={{
        pin1: "net.SYS_5V",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="buck33_C4"
      footprint="0402"
      capacitance="1uF"
      maxVoltageRating="10V"
      connections={{
        pin1: "net.SYS_5V",
        pin2: "net.GND",
      }}
    />

    <inductor
      name="buck33_L1"
      footprint="1210"
      inductance="1uH"
      maxCurrentRating="4A"
      connections={{
        pin1: "net.buck33_buck33_SW",
        pin2: "net.VDD_3V3",
      }}
    />

    <capacitor
      name="buck33_C5"
      footprint="0805"
      capacitance="22uF"
      maxVoltageRating="6.3V"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="buck33_C6"
      footprint="0805"
      capacitance="22uF"
      maxVoltageRating="6.3V"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
      }}
    />

    <resistor
      name="buck33_R1"
      footprint="0402"
      resistance="309k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.buck33_buck33_FB",
      }}
    />
    <resistor
      name="buck33_R2"
      footprint="0402"
      resistance="100k"
      connections={{
        pin1: "net.buck33_buck33_FB",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="buck33_C7"
      footprint="0402"
      capacitance="22pF"
      maxVoltageRating="16V"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.buck33_buck33_FB",
      }}
    />
    <capacitor
      name="buck33_C8"
      footprint="0402"
      capacitance="10nF"
      maxVoltageRating="16V"
      connections={{
        pin1: "net.buck33_buck33_SS",
        pin2: "net.GND",
      }}
    />

    {/* buck18 */}
    <chip
      name="buck18_U1"
      footprint="qfn16"
      pinLabels={{
        pin1: "SW",
        pin2: "SW",
        pin3: "PGND",
        pin4: "PGND",
        pin5: "VIN",
        pin6: "VIN",
        pin7: "EN",
        pin8: "PG",
        pin9: "AGND",
        pin10: "FB",
        pin11: "SS_TR",
        pin12: "DEF",
        pin13: "VOS",
      }}
      connections={{
        pin1: "net.buck18_SW_NODE",
        pin2: "net.buck18_SW_NODE",
        pin3: "net.GND",
        pin4: "net.GND",
        pin5: "net.SYS_5V",
        pin6: "net.SYS_5V",
        pin7: "net.SYS_5V",
        pin9: "net.GND",
        pin10: "net.buck18_FB_DIVIDER",
        pin11: "net.buck18_SOFTSTART",
        pin12: "net.GND",
        pin13: "net.VDD_1V8",
      }}
    />

    <capacitor
      name="buck18_C1"
      footprint="0805"
      capacitance="10uF"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />
    <capacitor
      name="buck18_C2"
      footprint="0805"
      capacitance="10uF"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />
    <capacitor
      name="buck18_C3"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />

    <inductor
      name="buck18_L1"
      footprint="0805"
      inductance="2.2uH"
      connections={{ pin1: "net.buck18_SW_NODE", pin2: "net.VDD_1V8" }}
    />

    <capacitor
      name="buck18_C4"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="buck18_C5"
      footprint="0805"
      capacitance="22uF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="buck18_C6"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />

    <resistor
      name="buck18_R1"
      footprint="0402"
      resistance="100k"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.buck18_FB_DIVIDER" }}
    />
    <resistor
      name="buck18_R2"
      footprint="0402"
      resistance="80.6k"
      connections={{ pin1: "net.buck18_FB_DIVIDER", pin2: "net.GND" }}
    />

    <capacitor
      name="buck18_C7"
      footprint="0402"
      capacitance="4.7nF"
      connections={{ pin1: "net.buck18_SOFTSTART", pin2: "net.GND" }}
    />

    {/* ldo06 */}
    <chip
      name="ldo06_U1"
      footprint="sot23_5"
      manufacturerPartNumber="TPS7A2006PDBVR"
      connections={{
        pin1: "net.VDD_1V8",
        pin2: "net.GND",
        pin3: "net.VDD_1V8",
        pin5: "net.VDD_DRAM_0V6",
      }}
    />
    <capacitor
      name="ldo06_C1"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_1V8",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="ldo06_C2"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_DRAM_0V6",
        pin2: "net.GND",
      }}
    />

    {/* ldortc */}
    <chip
      name="ldortc_U1"
      footprint="sot23_5"
      manufacturerPartNumber="LP5907MFX-3.0/NOPB"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
        pin3: "net.VDD_3V3",
        pin5: "net.VDD_RTC_3V0",
      }}
    />
    <capacitor
      name="ldortc_C1"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="ldortc_C2"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_RTC_3V0",
        pin2: "net.GND",
      }}
    />

    {/* ldoaudio */}
    <chip
      name="ldoaudio_U1"
      footprint="sot23_5"
      manufacturerPartNumber="AP2112K-3.3TRG1"
      pinLabels={{
        pin1: "GND",
        pin2: "VOUT",
        pin3: "EN",
        pin4: "NC",
        pin5: "VIN",
      }}
      connections={{
        pin1: "net.GND",
        pin2: "net.VDD_AUDIO_3V3",
        pin3: "net.VDD_3V3",
        pin5: "net.VDD_3V3",
      }}
    />
    <capacitor
      name="ldoaudio_C1"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="ldoaudio_C2"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.GND",
      }}
    />

    {/* ldohdmi */}
    <chip
      name="ldohdmi_U1"
      footprint="sot23_5"
      manufacturerPartNumber="TLV75518PDBVR"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
        pin3: "net.VDD_3V3",
        pin5: "net.VDD_HDMI_1V8",
      }}
    />
    <capacitor
      name="ldohdmi_C1"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="ldohdmi_C2"
      footprint="0402"
      capacitance="1uF"
      connections={{
        pin1: "net.VDD_HDMI_1V8",
        pin2: "net.GND",
      }}
    />

    {/* bulk */}
    <capacitor
      name="bulk_C1"
      capacitance="10uF"
      maxVoltageRating="16V"
      footprint="0805"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />
    <capacitor
      name="bulk_C2"
      capacitance="10uF"
      maxVoltageRating="16V"
      footprint="0805"
      connections={{ pin1: "net.SYS_5V", pin2: "net.GND" }}
    />

    {/* railcaps */}
    <capacitor
      name="railcaps_C1"
      capacitance="47uF"
      footprint="0805"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C2"
      capacitance="10uF"
      footprint="0805"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C3"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C4"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C5"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VDD_3V3", pin2: "net.GND" }}
    />

    <capacitor
      name="railcaps_C6"
      capacitance="22uF"
      footprint="0805"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C7"
      capacitance="10uF"
      footprint="0805"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C8"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C9"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />
    <capacitor
      name="railcaps_C10"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VDD_1V8", pin2: "net.GND" }}
    />

    {/* phy */}
    <chip
      name="phy_U1"
      manufacturerPartNumber="RTL8211F-CG"
      footprint="qfn48"
      pinLabels={{
        "1": "VDD33",
        "2": "AVDD33",
        "3": "VDDIO",
        "4": "GND",
        "5": "TXC",
        "6": "TXCTL",
        "7": "TXD0",
        "8": "TXD1",
        "9": "TXD2",
        "10": "TXD3",
        "11": "RXC",
        "12": "RXCTL",
        "13": "RXD0",
        "14": "RXD1",
        "15": "RXD2",
        "16": "RXD3",
        "17": "MDC",
        "18": "MDIO",
        "19": "RESET_N",
        "20": "TXP",
        "21": "TXN",
        "22": "RXP",
        "23": "RXN",
        "24": "XI",
        "25": "XO",
      }}
      connections={{
        VDD33: "net.VDD_3V3",
        AVDD33: "net.VDD_3V3",
        VDDIO: "net.VDD_1V8",
        GND: "net.GND",
        TXC: "net.RGMII_TXC",
        TXCTL: "net.RGMII_TXCTL",
        TXD0: "net.RGMII_TXD0",
        TXD1: "net.RGMII_TXD1",
        TXD2: "net.RGMII_TXD2",
        TXD3: "net.RGMII_TXD3",
        RXC: "net.RGMII_RXC",
        RXCTL: "net.RGMII_RXCTL",
        RXD0: "net.RGMII_RXD0",
        RXD1: "net.RGMII_RXD1",
        RXD2: "net.RGMII_RXD2",
        RXD3: "net.RGMII_RXD3",
        MDC: "net.ENET_MDC",
        MDIO: "net.ENET_MDIO",
        RESET_N: "net.ENET_RESET_N",
        TXP: "net.ETH_TXP",
        TXN: "net.ETH_TXN",
        RXP: "net.ETH_RXP",
        RXN: "net.ETH_RXN",
        XI: "net.ETH_XI",
        XO: "net.ETH_XO",
      }}
    />

    <resistor
      name="phy_R1"
      resistance="2.2k"
      footprint="0402"
      connections={{
        pin1: "net.ENET_MDIO",
        pin2: "net.VDD_1V8",
      }}
    />

    <resistor
      name="phy_R2"
      resistance="10k"
      footprint="0402"
      connections={{
        pin1: "net.ENET_RESET_N",
        pin2: "net.VDD_1V8",
      }}
    />

    <resistor
      name="phy_R3"
      resistance="10k"
      footprint="0402"
      connections={{
        pin1: "net.RGMII_RXD0",
        pin2: "net.VDD_1V8",
      }}
    />

    <resistor
      name="phy_R4"
      resistance="10k"
      footprint="0402"
      connections={{
        pin1: "net.RGMII_RXD1",
        pin2: "net.GND",
      }}
    />

    <resistor
      name="phy_R5"
      resistance="10k"
      footprint="0402"
      connections={{
        pin1: "net.RGMII_RXD2",
        pin2: "net.GND",
      }}
    />

    {/* ethxtal */}
    <crystal
      name="ethxtal_Y1"
      footprint="hc49"
      frequency="25MHz"
      loadCapacitance="18pF"
      connections={{
        pin1: "net.ETH_XI",
        pin2: "net.ETH_XO",
      }}
    />
    <capacitor
      name="ethxtal_C1"
      footprint="0402"
      capacitance="18pF"
      connections={{
        pin1: "net.ETH_XI",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="ethxtal_C2"
      footprint="0402"
      capacitance="18pF"
      connections={{
        pin1: "net.ETH_XO",
        pin2: "net.GND",
      }}
    />

    {/* magjack */}
    <chip
      name="magjack_J1"
      footprint="pinrow16"
      pinLabels={{
        pin1: "TXP",
        pin2: "TXN",
        pin3: "RXP",
        pin4: "RXN",
        pin5: "TX_CT",
        pin6: "RX_CT",
        pin7: "LED_LINK_A",
        pin8: "LED_LINK_K",
        pin9: "LED_ACT_A",
        pin10: "LED_ACT_K",
        pin11: "BS1",
        pin12: "BS2",
        pin13: "BS3",
        pin14: "BS4",
        pin15: "SHIELD",
      }}
      connections={{
        pin1: "net.ETH_TXP",
        pin2: "net.ETH_TXN",
        pin3: "net.ETH_RXP",
        pin4: "net.ETH_RXN",
        pin5: "net.VDD_3V3",
        pin6: "net.VDD_3V3",
        pin7: "net.magjack_magjack_link_led_anode",
        pin8: "net.LED_LINK",
        pin9: "net.magjack_magjack_act_led_anode",
        pin10: "net.LED_ACT",
        pin11: "net.magjack_magjack_bob_smith_1",
        pin12: "net.magjack_magjack_bob_smith_2",
        pin13: "net.magjack_magjack_bob_smith_3",
        pin14: "net.magjack_magjack_bob_smith_4",
        pin15: "net.GND",
      }}
    />

    <resistor
      name="magjack_R1"
      resistance="75ohm"
      footprint="0402"
      connections={{
        pin1: "net.magjack_magjack_bob_smith_1",
        pin2: "net.magjack_magjack_bob_smith_node",
      }}
    />
    <resistor
      name="magjack_R2"
      resistance="75ohm"
      footprint="0402"
      connections={{
        pin1: "net.magjack_magjack_bob_smith_2",
        pin2: "net.magjack_magjack_bob_smith_node",
      }}
    />
    <resistor
      name="magjack_R3"
      resistance="75ohm"
      footprint="0402"
      connections={{
        pin1: "net.magjack_magjack_bob_smith_3",
        pin2: "net.magjack_magjack_bob_smith_node",
      }}
    />
    <resistor
      name="magjack_R4"
      resistance="75ohm"
      footprint="0402"
      connections={{
        pin1: "net.magjack_magjack_bob_smith_4",
        pin2: "net.magjack_magjack_bob_smith_node",
      }}
    />
    <capacitor
      name="magjack_C1"
      capacitance="1nF"
      footprint="0805"
      connections={{
        pin1: "net.magjack_magjack_bob_smith_node",
        pin2: "net.GND",
      }}
    />

    <resistor
      name="magjack_R5"
      resistance="1kohm"
      footprint="0402"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.magjack_magjack_link_led_anode",
      }}
    />
    <resistor
      name="magjack_R6"
      resistance="1kohm"
      footprint="0402"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.magjack_magjack_act_led_anode",
      }}
    />

    {/* hdmitx */}
    <capacitor
      name="hdmitx_C1"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX2_P", pin2: "net.hdmitx_TMDS2_P_AC" }}
    />
    <capacitor
      name="hdmitx_C2"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX2_N", pin2: "net.hdmitx_TMDS2_N_AC" }}
    />
    <capacitor
      name="hdmitx_C3"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX1_P", pin2: "net.hdmitx_TMDS1_P_AC" }}
    />
    <capacitor
      name="hdmitx_C4"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX1_N", pin2: "net.hdmitx_TMDS1_N_AC" }}
    />
    <capacitor
      name="hdmitx_C5"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX0_P", pin2: "net.hdmitx_TMDS0_P_AC" }}
    />
    <capacitor
      name="hdmitx_C6"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_TX0_N", pin2: "net.hdmitx_TMDS0_N_AC" }}
    />
    <capacitor
      name="hdmitx_C7"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_CLK_P", pin2: "net.hdmitx_TMDSCLK_P_AC" }}
    />
    <capacitor
      name="hdmitx_C8"
      footprint="0402"
      capacitance="100nF"
      connections={{ pin1: "net.HDMI_CLK_N", pin2: "net.hdmitx_TMDSCLK_N_AC" }}
    />

    <diode
      name="hdmitx_D1"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS2_P_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D2"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS2_N_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D3"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS1_P_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D4"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS1_N_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D5"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS0_P_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D6"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDS0_N_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D7"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDSCLK_P_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D8"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.hdmitx_TMDSCLK_N_AC", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D9"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.I2C1_SCL", cathode: "net.GND" }}
    />
    <diode
      name="hdmitx_D10"
      footprint="0402"
      manufacturerPartNumber="ESD5V"
      connections={{ anode: "net.I2C1_SDA", cathode: "net.GND" }}
    />

    <connector
      name="hdmitx_J1"
      footprint="pinrow20"
      connections={{
        pin1: "net.hdmitx_TMDS2_P_AC",
        pin2: "net.GND",
        pin3: "net.hdmitx_TMDS2_N_AC",
        pin4: "net.hdmitx_TMDS1_P_AC",
        pin5: "net.GND",
        pin6: "net.hdmitx_TMDS1_N_AC",
        pin7: "net.hdmitx_TMDS0_P_AC",
        pin8: "net.GND",
        pin9: "net.hdmitx_TMDS0_N_AC",
        pin10: "net.hdmitx_TMDSCLK_P_AC",
        pin11: "net.GND",
        pin12: "net.hdmitx_TMDSCLK_N_AC",
        pin15: "net.I2C1_SCL",
        pin16: "net.I2C1_SDA",
        pin17: "net.GND",
      }}
    />

    {/* hdmiconn */}
    <chip
      name="hdmiconn_J1"
      footprint="pinrow20"
      pinLabels={{
        pin1: "1",
        pin2: "2",
        pin3: "3",
        pin4: "4",
        pin5: "5",
        pin6: "6",
        pin7: "7",
        pin8: "8",
        pin9: "9",
        pin10: "10",
        pin11: "11",
        pin12: "12",
        pin13: "13",
        pin14: "14",
        pin15: "15",
        pin16: "16",
        pin17: "17",
        pin18: "18",
        pin19: "19",
      }}
      connections={{
        pin1: "net.HDMI_TX2_P",
        pin2: "net.GND",
        pin3: "net.HDMI_TX2_N",
        pin4: "net.HDMI_TX1_P",
        pin5: "net.GND",
        pin6: "net.HDMI_TX1_N",
        pin7: "net.HDMI_TX0_P",
        pin8: "net.GND",
        pin9: "net.HDMI_TX0_N",
        pin10: "net.HDMI_CLK_P",
        pin11: "net.GND",
        pin12: "net.HDMI_CLK_N",
        pin13: "net.hdmiconn_HDMI_CEC",
        pin14: "net.hdmiconn_HDMI_HEAC",
        pin15: "net.hdmiconn_HDMI_DDC_SCL",
        pin16: "net.hdmiconn_HDMI_DDC_SDA",
        pin17: "net.GND",
        pin18: "net.SYS_5V",
        pin19: "net.HDMI_HPD",
      }}
    />

    <diode
      name="hdmiconn_D1"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX2_P", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D2"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX2_N", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D3"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX1_P", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D4"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX1_N", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D5"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX0_P", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D6"
      footprint="0402"
      connections={{ pin1: "net.HDMI_TX0_N", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D7"
      footprint="0402"
      connections={{ pin1: "net.HDMI_CLK_P", pin2: "net.GND" }}
    />
    <diode
      name="hdmiconn_D8"
      footprint="0402"
      connections={{ pin1: "net.HDMI_CLK_N", pin2: "net.GND" }}
    />

    {/* codec */}
    <chip
      name="codec_U1"
      footprint="qfn32"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.VDD_AUDIO_3V3",
        pin3: "net.GND",
        pin4: "net.SAI_MCLK",
        pin5: "net.SAI_BCLK",
        pin6: "net.SAI_LRCLK",
        pin7: "net.SAI_TXD",
        pin8: "net.SAI_RXD",
        pin9: "net.I2C1_SCL",
        pin10: "net.I2C1_SDA",
        pin11: "net.CODEC_RESET_N",
        pin12: "net.AUDIO_L",
        pin13: "net.AUDIO_R",
        pin14: "net.codec_codec_vmid",
        pin15: "net.codec_codec_dcvdd_1v8",
        pin16: "net.GND",
        pin17: "net.GND",
        pin18: "net.GND",
        pin19: "net.GND",
        pin20: "net.GND",
        pin21: "net.codec_codec_chargepump_positive",
        pin22: "net.codec_codec_chargepump_negative",
        pin23: "net.VDD_AUDIO_3V3",
        pin24: "net.GND",
        pin25: "net.GND",
        pin26: "net.GND",
        pin27: "net.GND",
        pin28: "net.GND",
        pin29: "net.GND",
        pin30: "net.GND",
        pin31: "net.GND",
        pin32: "net.GND",
      }}
    />

    <resistor
      name="codec_R1"
      resistance="4.7k"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.I2C1_SCL",
      }}
    />
    <resistor
      name="codec_R2"
      resistance="4.7k"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.I2C1_SDA",
      }}
    />
    <resistor
      name="codec_R3"
      resistance="10k"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.CODEC_RESET_N",
      }}
    />

    <capacitor
      name="codec_C1"
      capacitance="100nF"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="codec_C2"
      capacitance="1uF"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="codec_C3"
      capacitance="100nF"
      footprint="0402"
      connections={{
        pin1: "net.VDD_AUDIO_3V3",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="codec_C4"
      capacitance="1uF"
      footprint="0402"
      connections={{
        pin1: "net.codec_codec_dcvdd_1v8",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="codec_C5"
      capacitance="4.7uF"
      footprint="0402"
      connections={{
        pin1: "net.codec_codec_vmid",
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="codec_C6"
      capacitance="1uF"
      footprint="0402"
      connections={{
        pin1: "net.codec_codec_chargepump_positive",
        pin2: "net.codec_codec_chargepump_negative",
      }}
    />

    {/* audiojack */}
    <capacitor
      name="audiojack_C1"
      footprint="0805"
      capacitance="1uF"
      connections={{
        pin1: "net.AUDIO_L",
        pin2: "net.audiojack_HEADPHONE_L",
      }}
    />
    <capacitor
      name="audiojack_C2"
      footprint="0805"
      capacitance="1uF"
      connections={{
        pin1: "net.AUDIO_R",
        pin2: "net.audiojack_HEADPHONE_R",
      }}
    />
    <chip
      name="audiojack_J1"
      footprint="pinrow3"
      connections={{
        pin1: "net.audiojack_HEADPHONE_L",
        pin2: "net.audiojack_HEADPHONE_R",
        pin3: "net.GND",
      }}
    />

    {/* usbhost */}
    <chip
      name="usbhost_U1"
      footprint="sot23_5"
      pinLabels={{
        pin1: "ILIM",
        pin2: "GND",
        pin3: "EN",
        pin4: "IN",
        pin5: "OUT",
      }}
      connections={{
        pin1: "net.usbhost_usbhost_ILIM",
        pin2: "net.GND",
        pin3: "net.USB_VBUS_EN",
        pin4: "net.SYS_5V",
        pin5: "net.usbhost_usbhost_VBUS",
      }}
    />

    <resistor
      name="usbhost_R1"
      footprint="0402"
      resistance="49.9k"
      connections={{
        pin1: "net.usbhost_usbhost_ILIM",
        pin2: "net.GND",
      }}
    />

    <chip
      name="usbhost_U2"
      footprint="sot23_6"
      pinLabels={{
        pin1: "DP_A",
        pin2: "GND",
        pin3: "DN_A",
        pin4: "DN_B",
        pin5: "VBUS",
        pin6: "DP_B",
      }}
      connections={{
        pin1: "net.USB1_DP",
        pin2: "net.GND",
        pin3: "net.USB1_DN",
        pin4: "net.USB1_DN",
        pin5: "net.usbhost_usbhost_VBUS",
        pin6: "net.USB1_DP",
      }}
    />

    <chip
      name="usbhost_J1"
      footprint="pinrow6"
      pinLabels={{
        pin1: "VBUS",
        pin2: "D-",
        pin3: "D+",
        pin4: "GND",
        pin5: "SHIELD",
      }}
      connections={{
        pin1: "net.usbhost_usbhost_VBUS",
        pin2: "net.USB1_DN",
        pin3: "net.USB1_DP",
        pin4: "net.GND",
        pin5: "net.GND",
      }}
    />

    {/* usdcard */}
    <chip
      name="usdcard_J1"
      footprint="pinrow9"
      connections={{
        pin1: "net.SD_DAT2",
        pin2: "net.SD_DAT3",
        pin3: "net.SD_CMD",
        pin4: "net.VDD_3V3",
        pin5: "net.SD_CLK",
        pin6: "net.GND",
        pin7: "net.SD_DAT0",
        pin8: "net.SD_DAT1",
        pin9: "net.SD_CD",
      }}
    />

    {/* console */}
    <chip
      name="console_U1"
      footprint="soic16"
      manufacturerPartNumber="CH340C"
      connections={{
        pin1: "net.GND",
        pin2: "net.UART1_RXD",
        pin3: "net.UART1_TXD",
        pin4: "net.VDD_3V3",
        pin5: "net.USB_UART_DP",
        pin6: "net.USB_UART_DN",
        pin9: "net.VDD_3V3",
        pin10: "net.GND",
        pin11: "net.GND",
        pin12: "net.GND",
        pin13: "net.GND",
        pin16: "net.VDD_3V3",
      }}
    />

    {/* jtag */}
    <chip
      name="jtag_J1"
      footprint="pinrow10"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.JTAG_TMS",
        pin3: "net.GND",
        pin4: "net.JTAG_TCK",
        pin5: "net.GND",
        pin6: "net.JTAG_TDO",
        pin8: "net.JTAG_TDI",
        pin9: "net.GND",
        pin10: "net.SOC_RESET_N",
      }}
    />

    {/* bootsel */}
    <resistor
      name="bootsel_R1"
      footprint="0402"
      resistance="10k"
      connections={{
        pin1: "net.BOOT_MODE0",
        pin2: "net.GND",
      }}
    />
    <resistor
      name="bootsel_R2"
      footprint="0402"
      resistance="10k"
      connections={{
        pin1: "net.BOOT_MODE1",
        pin2: "net.GND",
      }}
    />
    <switch
      name="bootsel_SW1"
      footprint="pinrow6"
      connections={{
        pin1: "net.GND",
        pin2: "net.BOOT_MODE0",
        pin3: "net.VDD_3V3",
      }}
    />

    {/* reset */}
    <chip
      name="reset_U1"
      footprint="sot23_5"
      pinLabels={{
        pin1: "MR_N",
        pin2: "GND",
        pin3: "RESET_N",
        pin4: "VDD",
        pin5: "CT",
      }}
      connections={{
        pin1: "net.PWRON",
        pin2: "net.GND",
        pin3: "net.SOC_RESET_N",
        pin4: "net.VDD_3V3",
        pin5: "net.reset_reset_delay",
      }}
    />

    <resistor
      name="reset_R1"
      footprint="0402"
      resistance="10k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.PWRON",
      }}
    />

    <capacitor
      name="reset_C1"
      footprint="0402"
      capacitance="10nF"
      connections={{
        pin1: "net.reset_reset_delay",
        pin2: "net.GND",
      }}
    />

    <switch
      name="reset_SW1"
      footprint="pinrow2"
      connections={{
        pin1: "net.PWRON",
        pin2: "net.GND",
      }}
    />

    {/* eeprom */}
    <chip
      name="eeprom_U1"
      footprint="soic8"
      manufacturerPartNumber="AT24C256C-SSHL-T"
      connections={{
        pin1: "net.GND",
        pin2: "net.GND",
        pin3: "net.GND",
        pin4: "net.GND",
        pin5: "net.I2C1_SDA",
        pin6: "net.I2C1_SCL",
        pin7: "net.GND",
        pin8: "net.VDD_3V3",
      }}
    />
    <resistor
      name="eeprom_R1"
      footprint="0402"
      resistance="4.7k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.I2C1_SCL",
      }}
    />
    <resistor
      name="eeprom_R2"
      footprint="0402"
      resistance="4.7k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.I2C1_SDA",
      }}
    />

    {/* i2cpull */}
    <resistor
      name="i2cpull_R1"
      footprint="0402"
      resistance="4.7k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.I2C1_SCL",
      }}
    />
    <resistor
      name="i2cpull_R2"
      footprint="0402"
      resistance="4.7k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.I2C1_SDA",
      }}
    />

    {/* leds */}
    <resistor
      name="leds_R1"
      footprint="0805"
      resistance="1k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.leds_leds_power_led_anode",
      }}
    />
    <led
      name="leds_D1"
      footprint="0805"
      color="green"
      connections={{
        anode: "net.leds_leds_power_led_anode",
        cathode: "net.LED_PWR",
      }}
    />
    <resistor
      name="leds_R2"
      footprint="0805"
      resistance="1k"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.leds_leds_heartbeat_led_anode",
      }}
    />
    <led
      name="leds_D2"
      footprint="0805"
      color="yellow"
      connections={{
        anode: "net.leds_leds_heartbeat_led_anode",
        cathode: "net.LED_HEARTBEAT",
      }}
    />

    {/* expansion */}
    <chip
      name="expansion_J1"
      footprint="pinrow40"
      connections={{
        pin1: "net.VDD_3V3",
        pin2: "net.SYS_5V",
        pin3: "net.I2C1_SDA",
        pin4: "net.SYS_5V",
        pin5: "net.I2C1_SCL",
        pin6: "net.GND",
        pin7: "net.expansion_spare_io_1",
        pin8: "net.UART1_TXD",
        pin9: "net.GND",
        pin10: "net.UART1_RXD",
        pin11: "net.expansion_spare_io_2",
        pin12: "net.expansion_spare_io_3",
        pin13: "net.expansion_spare_io_4",
        pin14: "net.GND",
        pin15: "net.expansion_spare_io_5",
        pin16: "net.expansion_spare_io_6",
        pin17: "net.VDD_3V3",
        pin18: "net.expansion_spare_io_7",
        pin19: "net.expansion_spare_io_8",
        pin20: "net.GND",
        pin21: "net.expansion_spare_io_9",
        pin22: "net.expansion_spare_io_10",
        pin23: "net.expansion_spare_io_11",
        pin24: "net.expansion_spare_io_12",
        pin25: "net.GND",
        pin26: "net.expansion_spare_io_13",
        pin27: "net.expansion_spare_io_14",
        pin28: "net.expansion_spare_io_15",
        pin29: "net.expansion_spare_io_16",
        pin30: "net.GND",
        pin31: "net.expansion_spare_io_17",
        pin32: "net.expansion_spare_io_18",
        pin33: "net.expansion_spare_io_19",
        pin34: "net.GND",
        pin35: "net.SD_DAT0",
        pin36: "net.SD_DAT1",
        pin37: "net.expansion_spare_io_20",
        pin38: "net.expansion_spare_io_21",
        pin39: "net.GND",
        pin40: "net.expansion_spare_io_22",
      }}
    />
    <trace from=".codec_U1 > .pin12" to=".audiojack_C1 > .pin1" />
    <trace from=".codec_U1 > .pin13" to=".audiojack_C2 > .pin1" />
    <trace from=".audiojack_C1 > .pin2" to=".audiojack_J1 > .pin1" />
    <trace from=".audiojack_C2 > .pin2" to=".audiojack_J1 > .pin2" />
    <trace from=".bootsel_R1 > .pin1" to=".bootsel_SW1 > .pin2" />
    <trace from=".bootsel_SW1 > .pin2" to=".soc_U1 > .pin83" />
    <trace from=".bootsel_R2 > .pin1" to=".soc_U1 > .pin84" />
    <trace from=".buck18_U1 > .pin10" to=".buck18_R1 > .pin2" />
    <trace from=".buck18_R1 > .pin2" to=".buck18_R2 > .pin1" />
    <trace from=".buck18_U1 > .pin11" to=".buck18_C7 > .pin1" />
    <trace from=".buck18_U1 > .pin1" to=".buck18_U1 > .pin2" />
    <trace from=".buck18_U1 > .pin2" to=".buck18_L1 > .pin1" />
    <trace from=".buck33_U1 > .pin6" to=".buck33_R1 > .pin2" />
    <trace from=".buck33_R1 > .pin2" to=".buck33_R2 > .pin1" />
    <trace from=".buck33_R2 > .pin1" to=".buck33_C7 > .pin2" />
    <trace from=".buck33_U1 > .pin9" to=".buck33_C8 > .pin1" />
    <trace from=".buck33_U1 > .pin1" to=".buck33_U1 > .pin2" />
    <trace from=".buck33_U1 > .pin2" to=".buck33_L1 > .pin1" />
    <trace from=".codec_U1 > .pin22" to=".codec_C6 > .pin2" />
    <trace from=".codec_U1 > .pin21" to=".codec_C6 > .pin1" />
    <trace from=".codec_U1 > .pin15" to=".codec_C4 > .pin1" />
    <trace from=".codec_U1 > .pin14" to=".codec_C5 > .pin1" />
    <trace from=".codec_U1 > .pin11" to=".codec_R3 > .pin2" />
    <trace from=".soc_U1 > .pin37" to=".ddr_U1 > .pin17" />
    <trace from=".soc_U1 > .pin38" to=".ddr_U1 > .pin1" />
    <trace from=".soc_U1 > .pin39" to=".ddr_U1 > .pin2" />
    <trace from=".soc_U1 > .pin40" to=".ddr_U1 > .pin3" />
    <trace from=".soc_U1 > .pin41" to=".ddr_U1 > .pin4" />
    <trace from=".soc_U1 > .pin42" to=".ddr_U1 > .pin5" />
    <trace from=".soc_U1 > .pin43" to=".ddr_U1 > .pin6" />
    <trace from=".soc_U1 > .pin44" to=".ddr_U1 > .pin7" />
    <trace from=".soc_U1 > .pin45" to=".ddr_U1 > .pin8" />
    <trace from=".soc_U1 > .pin46" to=".ddr_U1 > .pin9" />
    <trace from=".soc_U1 > .pin52" to=".ddr_U1 > .pin32" />
    <trace from=".soc_U1 > .pin48" to=".ddr_U1 > .pin28" />
    <trace from=".soc_U1 > .pin47" to=".ddr_U1 > .pin27" />
    <trace from=".soc_U1 > .pin49" to=".ddr_U1 > .pin29" />
    <trace from=".soc_U1 > .pin50" to=".ddr_U1 > .pin30" />
    <trace from=".soc_U1 > .pin21" to=".ddr_U1 > .pin1" />
    <trace from=".soc_U1 > .pin22" to=".ddr_U1 > .pin2" />
    <trace from=".soc_U1 > .pin31" to=".ddr_U1 > .pin11" />
    <trace from=".soc_U1 > .pin32" to=".ddr_U1 > .pin12" />
    <trace from=".soc_U1 > .pin33" to=".ddr_U1 > .pin13" />
    <trace from=".soc_U1 > .pin34" to=".ddr_U1 > .pin14" />
    <trace from=".soc_U1 > .pin35" to=".ddr_U1 > .pin15" />
    <trace from=".soc_U1 > .pin36" to=".ddr_U1 > .pin16" />
    <trace from=".soc_U1 > .pin23" to=".ddr_U1 > .pin3" />
    <trace from=".soc_U1 > .pin24" to=".ddr_U1 > .pin4" />
    <trace from=".soc_U1 > .pin25" to=".ddr_U1 > .pin5" />
    <trace from=".soc_U1 > .pin26" to=".ddr_U1 > .pin6" />
    <trace from=".soc_U1 > .pin27" to=".ddr_U1 > .pin7" />
    <trace from=".soc_U1 > .pin28" to=".ddr_U1 > .pin8" />
    <trace from=".soc_U1 > .pin29" to=".ddr_U1 > .pin9" />
    <trace from=".soc_U1 > .pin30" to=".ddr_U1 > .pin10" />
    <trace from=".soc_U1 > .pin51" to=".ddr_U1 > .pin31" />
    <trace from=".ddrterm_R1 > .pin2" to=".ddrterm_R2 > .pin1" />
    <trace from=".soc_U1 > .pin53" to=".ddr_U1 > .pin33" />
    <trace from=".soc_U1 > .pin54" to=".emmc_U1 > .pin3" />
    <trace from=".soc_U1 > .pin55" to=".emmc_U1 > .pin4" />
    <trace from=".soc_U1 > .pin57" to=".emmc_U1 > .pin6" />
    <trace from=".soc_U1 > .pin58" to=".emmc_U1 > .pin7" />
    <trace from=".soc_U1 > .pin59" to=".emmc_U1 > .pin8" />
    <trace from=".soc_U1 > .pin60" to=".emmc_U1 > .pin9" />
    <trace from=".soc_U1 > .pin61" to=".emmc_U1 > .pin10" />
    <trace from=".soc_U1 > .pin62" to=".emmc_U1 > .pin11" />
    <trace from=".soc_U1 > .pin63" to=".emmc_U1 > .pin12" />
    <trace from=".soc_U1 > .pin64" to=".emmc_U1 > .pin13" />
    <trace from=".soc_U1 > .pin56" to=".emmc_U1 > .pin5" />
    <trace from=".phy_U1 > .pin18" to=".phy_R1 > .pin1" />
    <trace from=".phy_U1 > .pin19" to=".phy_R2 > .pin1" />
    <trace from=".phy_U1 > .pin23" to=".magjack_J1 > .pin4" />
    <trace from=".phy_U1 > .pin22" to=".magjack_J1 > .pin3" />
    <trace from=".phy_U1 > .pin21" to=".magjack_J1 > .pin2" />
    <trace from=".phy_U1 > .pin20" to=".magjack_J1 > .pin1" />
    <trace from=".phy_U1 > .pin24" to=".ethxtal_Y1 > .pin1" />
    <trace from=".ethxtal_Y1 > .pin1" to=".ethxtal_C1 > .pin1" />
    <trace from=".phy_U1 > .pin25" to=".ethxtal_Y1 > .pin2" />
    <trace from=".ethxtal_Y1 > .pin2" to=".ethxtal_C2 > .pin1" />
    <trace from=".pmic_U1 > .pin22" to=".pmic_U1 > .pin23" />
    <trace from=".pmic_U1 > .pin23" to=".pmic_U1 > .pin24" />
    <trace from=".pmic_U1 > .pin24" to=".pmic_U1 > .pin25" />
    <trace from=".pmic_U1 > .pin25" to=".pmic_U1 > .pin26" />
    <trace from=".pmic_U1 > .pin26" to=".pmic_U1 > .pin27" />
    <trace from=".pmic_U1 > .pin27" to=".pmic_U1 > .pin28" />
    <trace from=".pmic_U1 > .pin28" to=".pmic_U1 > .pin29" />
    <trace from=".pmic_U1 > .pin29" to=".pmic_U1 > .pin30" />
    <trace from=".pmic_U1 > .pin30" to=".pmic_U1 > .pin31" />
    <trace from=".pmic_U1 > .pin31" to=".pmic_U1 > .pin32" />
    <trace from=".pmic_U1 > .pin32" to=".pmic_U1 > .pin33" />
    <trace from=".pmic_U1 > .pin33" to=".pmic_U1 > .pin34" />
    <trace from=".pmic_U1 > .pin34" to=".pmic_U1 > .pin42" />
    <trace from=".pmic_U1 > .pin42" to=".pmic_U1 > .pin43" />
    <trace from=".pmic_U1 > .pin43" to=".pmic_U1 > .pin44" />
    <trace from=".pmic_U1 > .pin44" to=".pmic_U1 > .pin45" />
    <trace from=".pmic_U1 > .pin45" to=".pmic_U1 > .pin46" />
    <trace from=".pmic_U1 > .pin46" to=".pmic_U1 > .pin47" />
    <trace from=".pmic_U1 > .pin47" to=".pmic_U1 > .pin48" />
    <trace from=".pmic_U1 > .pin48" to=".pmic_U1 > .pin49" />
    <trace from=".pmic_U1 > .pin49" to=".pmic_U1 > .pin50" />
    <trace from=".pmic_U1 > .pin50" to=".pmic_U1 > .pin51" />
    <trace from=".pmic_U1 > .pin51" to=".pmic_U1 > .pin52" />
    <trace from=".pmic_U1 > .pin52" to=".pmic_U1 > .pin53" />
    <trace from=".pmic_U1 > .pin53" to=".pmic_U1 > .pin54" />
    <trace from=".pmic_U1 > .pin54" to=".pmic_U1 > .pin55" />
    <trace from=".pmic_U1 > .pin55" to=".pmic_U1 > .pin56" />
    <trace from=".pmic_U1 > .pin56" to=".pmic_U1 > .pin57" />
    <trace from=".pmic_U1 > .pin57" to=".pmic_U1 > .pin58" />
    <trace from=".pmic_U1 > .pin58" to=".pmic_U1 > .pin59" />
    <trace from=".pmic_U1 > .pin59" to=".pmic_U1 > .pin60" />
    <trace from=".pmic_U1 > .pin60" to=".pmic_U1 > .pin61" />
    <trace from=".pmic_U1 > .pin61" to=".pmic_U1 > .pin62" />
    <trace from=".pmic_U1 > .pin62" to=".pmic_U1 > .pin63" />
    <trace from=".pmic_U1 > .pin63" to=".pmic_U1 > .pin64" />
    <trace from=".pmic_U1 > .pin64" to=".pmic_U1 > .pin65" />
    <trace from=".pmic_U1 > .pin65" to=".pmic_U1 > .pin66" />
    <trace from=".pmic_U1 > .pin66" to=".pmic_U1 > .pin67" />
    <trace from=".pmic_U1 > .pin67" to=".pmic_U1 > .pin68" />
    <trace from=".pmic_U1 > .pin68" to=".pmic_C1 > .pin2" />
    <trace from=".pmic_C1 > .pin2" to=".pmic_C2 > .pin2" />
    <trace from=".pmic_C2 > .pin2" to=".pmic_C3 > .pin2" />
    <trace from=".pmic_C3 > .pin2" to=".pmic_C4 > .pin2" />
    <trace from=".pmic_C4 > .pin2" to=".pmic_C5 > .pin2" />
    <trace from=".pmic_C5 > .pin2" to=".pmic_C6 > .pin2" />
    <trace from=".pmic_C6 > .pin2" to=".pmic_C7 > .pin2" />
    <trace from=".pmic_C7 > .pin2" to=".pmic_C8 > .pin2" />
    <trace from=".pmic_C8 > .pin2" to=".pmic_C9 > .pin2" />
    <trace from=".pmic_C9 > .pin2" to=".pmic_C10 > .pin2" />
    <trace from=".pmic_C10 > .pin2" to=".pmic_C11 > .pin2" />
    <trace from=".pmic_C11 > .pin2" to=".pmic_C12 > .pin2" />
    <trace from=".pmic_C12 > .pin2" to=".pmic_R5 > .pin2" />
    <trace from=".pmic_R5 > .pin2" to=".usbcpd_J1 > .pin1" />
    <trace from=".usbcpd_J1 > .pin1" to=".usbcpd_J1 > .pin8" />
    <trace from=".usbcpd_J1 > .pin8" to=".usbcpd_J1 > .pin9" />
    <trace from=".usbcpd_J1 > .pin9" to=".usbcpd_J1 > .pin16" />
    <trace from=".usbcpd_J1 > .pin16" to=".usbcpd_J1 > .pin17" />
    <trace from=".usbcpd_J1 > .pin17" to=".usbcpd_R1 > .pin2" />
    <trace from=".usbcpd_R1 > .pin2" to=".usbcpd_R2 > .pin2" />
    <trace from=".usbcpd_R2 > .pin2" to=".usbcpd_U1 > .pin4" />
    <trace from=".usbcpd_U1 > .pin4" to=".usbcpd_U2 > .pin5" />
    <trace from=".usbcpd_U2 > .pin5" to=".usbcpd_D1 > .pin1" />
    <trace from=".usbcpd_D1 > .pin1" to=".inprot_R1 > .pin2" />
    <trace from=".inprot_R1 > .pin2" to=".buck33_U1 > .pin3" />
    <trace from=".buck33_U1 > .pin3" to=".buck33_U1 > .pin4" />
    <trace from=".buck33_U1 > .pin4" to=".buck33_U1 > .pin5" />
    <trace from=".buck33_U1 > .pin5" to=".buck33_C1 > .pin2" />
    <trace from=".buck33_C1 > .pin2" to=".buck33_C2 > .pin2" />
    <trace from=".buck33_C2 > .pin2" to=".buck33_C3 > .pin2" />
    <trace from=".buck33_C3 > .pin2" to=".buck33_C4 > .pin2" />
    <trace from=".buck33_C4 > .pin2" to=".buck33_C5 > .pin2" />
    <trace from=".buck33_C5 > .pin2" to=".buck33_C6 > .pin2" />
    <trace from=".buck33_C6 > .pin2" to=".buck33_R2 > .pin2" />
    <trace from=".buck33_R2 > .pin2" to=".buck33_C8 > .pin2" />
    <trace from=".buck33_C8 > .pin2" to=".buck18_U1 > .pin3" />
    <trace from=".buck18_U1 > .pin3" to=".buck18_U1 > .pin4" />
    <trace from=".buck18_U1 > .pin4" to=".buck18_U1 > .pin9" />
    <trace from=".buck18_U1 > .pin9" to=".buck18_U1 > .pin12" />
    <trace from=".buck18_U1 > .pin12" to=".buck18_C1 > .pin2" />
    <trace from=".buck18_C1 > .pin2" to=".buck18_C2 > .pin2" />
    <trace from=".buck18_C2 > .pin2" to=".buck18_C3 > .pin2" />
    <trace from=".buck18_C3 > .pin2" to=".buck18_C4 > .pin2" />
    <trace from=".buck18_C4 > .pin2" to=".buck18_C5 > .pin2" />
    <trace from=".buck18_C5 > .pin2" to=".buck18_C6 > .pin2" />
    <trace from=".buck18_C6 > .pin2" to=".buck18_R2 > .pin2" />
    <trace from=".buck18_R2 > .pin2" to=".buck18_C7 > .pin2" />
    <trace from=".buck18_C7 > .pin2" to=".ldo06_U1 > .pin2" />
    <trace from=".ldo06_U1 > .pin2" to=".ldo06_C1 > .pin2" />
    <trace from=".ldo06_C1 > .pin2" to=".ldo06_C2 > .pin2" />
    <trace from=".ldo06_C2 > .pin2" to=".ldortc_U1 > .pin2" />
    <trace from=".ldortc_U1 > .pin2" to=".ldortc_C1 > .pin2" />
    <trace from=".ldortc_C1 > .pin2" to=".ldortc_C2 > .pin2" />
    <trace from=".ldortc_C2 > .pin2" to=".ldoaudio_U1 > .pin1" />
    <trace from=".ldoaudio_U1 > .pin1" to=".ldoaudio_C1 > .pin2" />
    <trace from=".ldoaudio_C1 > .pin2" to=".ldoaudio_C2 > .pin2" />
    <trace from=".ldoaudio_C2 > .pin2" to=".ldohdmi_U1 > .pin2" />
    <trace from=".ldohdmi_U1 > .pin2" to=".ldohdmi_C1 > .pin2" />
    <trace from=".ldohdmi_C1 > .pin2" to=".ldohdmi_C2 > .pin2" />
    <trace from=".ldohdmi_C2 > .pin2" to=".bulk_C1 > .pin2" />
    <trace from=".bulk_C1 > .pin2" to=".bulk_C2 > .pin2" />
    <trace from=".bulk_C2 > .pin2" to=".railcaps_C1 > .pin2" />
    <trace from=".railcaps_C1 > .pin2" to=".railcaps_C2 > .pin2" />
    <trace from=".railcaps_C2 > .pin2" to=".railcaps_C3 > .pin2" />
    <trace from=".railcaps_C3 > .pin2" to=".railcaps_C4 > .pin2" />
    <trace from=".railcaps_C4 > .pin2" to=".railcaps_C5 > .pin2" />
    <trace from=".railcaps_C5 > .pin2" to=".railcaps_C6 > .pin2" />
    <trace from=".railcaps_C6 > .pin2" to=".railcaps_C7 > .pin2" />
    <trace from=".railcaps_C7 > .pin2" to=".railcaps_C8 > .pin2" />
    <trace from=".railcaps_C8 > .pin2" to=".railcaps_C9 > .pin2" />
    <trace from=".railcaps_C9 > .pin2" to=".railcaps_C10 > .pin2" />
    <trace from=".railcaps_C10 > .pin2" to=".phy_U1 > .pin4" />
    <trace from=".phy_U1 > .pin4" to=".phy_R4 > .pin2" />
    <trace from=".phy_R4 > .pin2" to=".phy_R5 > .pin2" />
    <trace from=".phy_R5 > .pin2" to=".ethxtal_C1 > .pin2" />
    <trace from=".ethxtal_C1 > .pin2" to=".ethxtal_C2 > .pin2" />
    <trace from=".ethxtal_C2 > .pin2" to=".magjack_J1 > .pin15" />
    <trace from=".magjack_J1 > .pin15" to=".magjack_C1 > .pin2" />
    <trace from=".magjack_C1 > .pin2" to=".hdmitx_D1 > .pin2" />
    <trace from=".hdmitx_D1 > .pin2" to=".hdmitx_D2 > .pin2" />
    <trace from=".hdmitx_D2 > .pin2" to=".hdmitx_D3 > .pin2" />
    <trace from=".hdmitx_D3 > .pin2" to=".hdmitx_D4 > .pin2" />
    <trace from=".hdmitx_D4 > .pin2" to=".hdmitx_D5 > .pin2" />
    <trace from=".hdmitx_D5 > .pin2" to=".hdmitx_D6 > .pin2" />
    <trace from=".hdmitx_D6 > .pin2" to=".hdmitx_D7 > .pin2" />
    <trace from=".hdmitx_D7 > .pin2" to=".hdmitx_D8 > .pin2" />
    <trace from=".hdmitx_D8 > .pin2" to=".hdmitx_D9 > .pin2" />
    <trace from=".hdmitx_D9 > .pin2" to=".hdmitx_D10 > .pin2" />
    <trace from=".hdmitx_D10 > .pin2" to=".hdmitx_J1 > .pin2" />
    <trace from=".hdmitx_J1 > .pin2" to=".hdmitx_J1 > .pin5" />
    <trace from=".hdmitx_J1 > .pin5" to=".hdmitx_J1 > .pin8" />
    <trace from=".hdmitx_J1 > .pin8" to=".hdmitx_J1 > .pin11" />
    <trace from=".hdmitx_J1 > .pin11" to=".hdmitx_J1 > .pin17" />
    <trace from=".hdmitx_J1 > .pin17" to=".hdmiconn_J1 > .pin2" />
    <trace from=".hdmiconn_J1 > .pin2" to=".hdmiconn_J1 > .pin5" />
    <trace from=".hdmiconn_J1 > .pin5" to=".hdmiconn_J1 > .pin8" />
    <trace from=".hdmiconn_J1 > .pin8" to=".hdmiconn_J1 > .pin11" />
    <trace from=".hdmiconn_J1 > .pin11" to=".hdmiconn_J1 > .pin17" />
    <trace from=".hdmiconn_J1 > .pin17" to=".hdmiconn_D1 > .pin2" />
    <trace from=".hdmiconn_D1 > .pin2" to=".hdmiconn_D2 > .pin2" />
    <trace from=".hdmiconn_D2 > .pin2" to=".hdmiconn_D3 > .pin2" />
    <trace from=".hdmiconn_D3 > .pin2" to=".hdmiconn_D4 > .pin2" />
    <trace from=".hdmiconn_D4 > .pin2" to=".soc_U1 > .pin16" />
    <trace from=".soc_U1 > .pin16" to=".hdmiconn_D5 > .pin2" />
    <trace from=".hdmiconn_D5 > .pin2" to=".hdmiconn_D6 > .pin2" />
    <trace from=".hdmiconn_D6 > .pin2" to=".hdmiconn_D7 > .pin2" />
    <trace from=".hdmiconn_D7 > .pin2" to=".hdmiconn_D8 > .pin2" />
    <trace from=".hdmiconn_D8 > .pin2" to=".codec_U1 > .pin3" />
    <trace from=".codec_U1 > .pin3" to=".codec_U1 > .pin16" />
    <trace from=".codec_U1 > .pin16" to=".codec_U1 > .pin17" />
    <trace from=".codec_U1 > .pin17" to=".codec_U1 > .pin18" />
    <trace from=".codec_U1 > .pin18" to=".codec_U1 > .pin19" />
    <trace from=".codec_U1 > .pin19" to=".codec_U1 > .pin20" />
    <trace from=".codec_U1 > .pin20" to=".codec_U1 > .pin24" />
    <trace from=".codec_U1 > .pin24" to=".codec_U1 > .pin25" />
    <trace from=".codec_U1 > .pin25" to=".codec_U1 > .pin26" />
    <trace from=".codec_U1 > .pin26" to=".codec_U1 > .pin27" />
    <trace from=".codec_U1 > .pin27" to=".codec_U1 > .pin28" />
    <trace from=".codec_U1 > .pin28" to=".codec_U1 > .pin29" />
    <trace from=".codec_U1 > .pin29" to=".codec_U1 > .pin30" />
    <trace from=".codec_U1 > .pin30" to=".codec_U1 > .pin31" />
    <trace from=".codec_U1 > .pin31" to=".codec_U1 > .pin32" />
    <trace from=".codec_U1 > .pin32" to=".codec_C1 > .pin2" />
    <trace from=".codec_C1 > .pin2" to=".codec_C2 > .pin2" />
    <trace from=".codec_C2 > .pin2" to=".codec_C3 > .pin2" />
    <trace from=".codec_C3 > .pin2" to=".codec_C4 > .pin2" />
    <trace from=".codec_C4 > .pin2" to=".codec_C5 > .pin2" />
    <trace from=".codec_C5 > .pin2" to=".audiojack_J1 > .pin3" />
    <trace from=".audiojack_J1 > .pin3" to=".usbhost_U1 > .pin2" />
    <trace from=".usbhost_U1 > .pin2" to=".usbhost_R1 > .pin2" />
    <trace from=".usbhost_R1 > .pin2" to=".usbhost_U2 > .pin2" />
    <trace from=".usbhost_U2 > .pin2" to=".usbhost_J1 > .pin4" />
    <trace from=".usbhost_J1 > .pin4" to=".usbhost_J1 > .pin5" />
    <trace from=".usbhost_J1 > .pin5" to=".usdcard_J1 > .pin6" />
    <trace from=".usdcard_J1 > .pin6" to=".console_U1 > .pin1" />
    <trace from=".console_U1 > .pin1" to=".soc_U1 > .pin17" />
    <trace from=".soc_U1 > .pin17" to=".console_U1 > .pin10" />
    <trace from=".console_U1 > .pin10" to=".console_U1 > .pin11" />
    <trace from=".console_U1 > .pin11" to=".console_U1 > .pin12" />
    <trace from=".console_U1 > .pin12" to=".console_U1 > .pin13" />
    <trace from=".console_U1 > .pin13" to=".jtag_J1 > .pin3" />
    <trace from=".jtag_J1 > .pin3" to=".jtag_J1 > .pin5" />
    <trace from=".jtag_J1 > .pin5" to=".jtag_J1 > .pin9" />
    <trace from=".jtag_J1 > .pin9" to=".bootsel_R1 > .pin2" />
    <trace from=".bootsel_R1 > .pin2" to=".bootsel_R2 > .pin2" />
    <trace from=".bootsel_R2 > .pin2" to=".bootsel_SW1 > .pin1" />
    <trace from=".bootsel_SW1 > .pin1" to=".reset_U1 > .pin2" />
    <trace from=".reset_U1 > .pin2" to=".reset_C1 > .pin2" />
    <trace from=".reset_C1 > .pin2" to=".reset_SW1 > .pin2" />
    <trace from=".reset_SW1 > .pin2" to=".eeprom_U1 > .pin1" />
    <trace from=".eeprom_U1 > .pin1" to=".eeprom_U1 > .pin2" />
    <trace from=".eeprom_U1 > .pin2" to=".eeprom_U1 > .pin3" />
    <trace from=".eeprom_U1 > .pin3" to=".eeprom_U1 > .pin4" />
    <trace from=".eeprom_U1 > .pin4" to=".eeprom_U1 > .pin7" />
    <trace from=".eeprom_U1 > .pin7" to=".expansion_J1 > .pin6" />
    <trace from=".expansion_J1 > .pin6" to=".expansion_J1 > .pin9" />
    <trace from=".expansion_J1 > .pin9" to=".expansion_J1 > .pin14" />
    <trace from=".expansion_J1 > .pin14" to=".expansion_J1 > .pin20" />
    <trace from=".expansion_J1 > .pin20" to=".expansion_J1 > .pin25" />
    <trace from=".expansion_J1 > .pin25" to=".expansion_J1 > .pin30" />
    <trace from=".expansion_J1 > .pin30" to=".expansion_J1 > .pin34" />
    <trace from=".expansion_J1 > .pin34" to=".soc_U1 > .pin18" />
    <trace from=".soc_U1 > .pin18" to=".expansion_J1 > .pin39" />
    <trace from=".expansion_J1 > .pin39" to=".soc_U1 > .pin19" />
    <trace from=".soc_U1 > .pin19" to=".soc_U1 > .pin20" />
    <trace from=".soc_U1 > .pin20" to=".socdecoup_C1 > .pin2" />
    <trace from=".socdecoup_C1 > .pin2" to=".socdecoup_C2 > .pin2" />
    <trace from=".socdecoup_C2 > .pin2" to=".socdecoup_C3 > .pin2" />
    <trace from=".socdecoup_C3 > .pin2" to=".socdecoup_C4 > .pin2" />
    <trace from=".socdecoup_C4 > .pin2" to=".socdecoup_C5 > .pin2" />
    <trace from=".socdecoup_C5 > .pin2" to=".socdecoup_C6 > .pin2" />
    <trace from=".socdecoup_C6 > .pin2" to=".socdecoup_C7 > .pin2" />
    <trace from=".socdecoup_C7 > .pin2" to=".socdecoup_C8 > .pin2" />
    <trace from=".socdecoup_C8 > .pin2" to=".socdecoup_C9 > .pin2" />
    <trace from=".socdecoup_C9 > .pin2" to=".socdecoup_C10 > .pin2" />
    <trace from=".socdecoup_C10 > .pin2" to=".socdecoup_C11 > .pin2" />
    <trace from=".socdecoup_C11 > .pin2" to=".socdecoup_C12 > .pin2" />
    <trace from=".socdecoup_C12 > .pin2" to=".socdecoup_C13 > .pin2" />
    <trace from=".socdecoup_C13 > .pin2" to=".socdecoup_C14 > .pin2" />
    <trace from=".socdecoup_C14 > .pin2" to=".socdecoup_C15 > .pin2" />
    <trace from=".socdecoup_C15 > .pin2" to=".socdecoup_C16 > .pin2" />
    <trace from=".socdecoup_C16 > .pin2" to=".socdecoup_C17 > .pin2" />
    <trace from=".socdecoup_C17 > .pin2" to=".socdecoup_C18 > .pin2" />
    <trace from=".socdecoup_C18 > .pin2" to=".socdecoup_C19 > .pin2" />
    <trace from=".socdecoup_C19 > .pin2" to=".socdecoup_C20 > .pin2" />
    <trace from=".socdecoup_C20 > .pin2" to=".socdecoup_C21 > .pin2" />
    <trace from=".socdecoup_C21 > .pin2" to=".socdecoup_C22 > .pin2" />
    <trace from=".socdecoup_C22 > .pin2" to=".socdecoup_C23 > .pin2" />
    <trace from=".socdecoup_C23 > .pin2" to=".socdecoup_C24 > .pin2" />
    <trace from=".socdecoup_C24 > .pin2" to=".socdecoup_C25 > .pin2" />
    <trace from=".socdecoup_C25 > .pin2" to=".socdecoup_C26 > .pin2" />
    <trace from=".socdecoup_C26 > .pin2" to=".socdecoup_C27 > .pin2" />
    <trace from=".socdecoup_C27 > .pin2" to=".socdecoup_C28 > .pin2" />
    <trace from=".socdecoup_C28 > .pin2" to=".socdecoup_C29 > .pin2" />
    <trace from=".socdecoup_C29 > .pin2" to=".socdecoup_C30 > .pin2" />
    <trace from=".socdecoup_C30 > .pin2" to=".socdecoup_C31 > .pin2" />
    <trace from=".socdecoup_C31 > .pin2" to=".socdecoup_C32 > .pin2" />
    <trace from=".socdecoup_C32 > .pin2" to=".socdecoup_C33 > .pin2" />
    <trace from=".socdecoup_C33 > .pin2" to=".socdecoup_C34 > .pin2" />
    <trace from=".socdecoup_C34 > .pin2" to=".socdecoup_C35 > .pin2" />
    <trace from=".socdecoup_C35 > .pin2" to=".socdecoup_C36 > .pin2" />
    <trace from=".socdecoup_C36 > .pin2" to=".socdecoup_C37 > .pin2" />
    <trace from=".socdecoup_C37 > .pin2" to=".socdecoup_C38 > .pin2" />
    <trace from=".socdecoup_C38 > .pin2" to=".socdecoup_C39 > .pin2" />
    <trace from=".socdecoup_C39 > .pin2" to=".socdecoup_C40 > .pin2" />
    <trace from=".socdecoup_C40 > .pin2" to=".xtal24_C1 > .pin2" />
    <trace from=".xtal24_C1 > .pin2" to=".xtal24_C2 > .pin2" />
    <trace from=".xtal24_C2 > .pin2" to=".rtcxtal_C1 > .pin2" />
    <trace from=".rtcxtal_C1 > .pin2" to=".rtcxtal_C2 > .pin2" />
    <trace from=".rtcxtal_C2 > .pin2" to=".ddr_U1 > .pin40" />
    <trace from=".ddr_U1 > .pin40" to=".ddr_U1 > .pin41" />
    <trace from=".ddr_U1 > .pin41" to=".ddr_U1 > .pin42" />
    <trace from=".ddr_U1 > .pin42" to=".ddr_U1 > .pin43" />
    <trace from=".ddr_U1 > .pin43" to=".ddr_U1 > .pin44" />
    <trace from=".ddr_U1 > .pin44" to=".ddrterm_R2 > .pin2" />
    <trace from=".ddrterm_R2 > .pin2" to=".ddrterm_R3 > .pin2" />
    <trace from=".ddrterm_R3 > .pin2" to=".ddrdecoup_C1 > .pin2" />
    <trace from=".ddrdecoup_C1 > .pin2" to=".ddrdecoup_C2 > .pin2" />
    <trace from=".ddrdecoup_C2 > .pin2" to=".ddrdecoup_C3 > .pin2" />
    <trace from=".ddrdecoup_C3 > .pin2" to=".ddrdecoup_C4 > .pin2" />
    <trace from=".ddrdecoup_C4 > .pin2" to=".ddrdecoup_C5 > .pin2" />
    <trace from=".ddrdecoup_C5 > .pin2" to=".ddrdecoup_C6 > .pin2" />
    <trace from=".ddrdecoup_C6 > .pin2" to=".emmc_U1 > .pin14" />
    <trace from=".emmc_U1 > .pin14" to=".emmc_U1 > .pin15" />
    <trace from=".emmc_U1 > .pin15" to=".emmc_U1 > .pin16" />
    <trace from=".emmc_U1 > .pin16" to=".emmc_U1 > .pin17" />
    <trace from=".emmc_U1 > .pin17" to=".emmc_U1 > .pin18" />
    <trace from=".emmc_U1 > .pin18" to=".emmc_U1 > .pin19" />
    <trace from=".emmc_U1 > .pin19" to=".emmc_U1 > .pin20" />
    <trace from=".emmc_U1 > .pin20" to=".emmc_U1 > .pin21" />
    <trace from=".emmc_U1 > .pin21" to=".emmc_U1 > .pin22" />
    <trace from=".emmc_U1 > .pin22" to=".emmc_U1 > .pin23" />
    <trace from=".emmc_U1 > .pin23" to=".emmc_U1 > .pin24" />
    <trace from=".emmc_U1 > .pin24" to=".emmc_U1 > .pin25" />
    <trace from=".emmc_U1 > .pin25" to=".emmc_U1 > .pin26" />
    <trace from=".emmc_U1 > .pin26" to=".emmc_U1 > .pin27" />
    <trace from=".emmc_U1 > .pin27" to=".emmc_U1 > .pin28" />
    <trace from=".emmc_U1 > .pin28" to=".emmc_U1 > .pin29" />
    <trace from=".emmc_U1 > .pin29" to=".emmc_U1 > .pin30" />
    <trace from=".emmc_U1 > .pin30" to=".emmc_U1 > .pin31" />
    <trace from=".emmc_U1 > .pin31" to=".emmc_U1 > .pin32" />
    <trace from=".emmc_U1 > .pin32" to=".emmc_U1 > .pin33" />
    <trace from=".emmc_U1 > .pin33" to=".emmc_U1 > .pin34" />
    <trace from=".emmc_U1 > .pin34" to=".emmc_U1 > .pin35" />
    <trace from=".emmc_U1 > .pin35" to=".emmc_U1 > .pin36" />
    <trace from=".emmc_U1 > .pin36" to=".emmc_U1 > .pin37" />
    <trace from=".emmc_U1 > .pin37" to=".emmc_U1 > .pin38" />
    <trace from=".emmc_U1 > .pin38" to=".emmc_U1 > .pin39" />
    <trace from=".emmc_U1 > .pin39" to=".emmc_U1 > .pin40" />
    <trace from=".emmc_U1 > .pin40" to=".emmc_U1 > .pin41" />
    <trace from=".emmc_U1 > .pin41" to=".emmc_U1 > .pin42" />
    <trace from=".emmc_U1 > .pin42" to=".emmc_U1 > .pin43" />
    <trace from=".emmc_U1 > .pin43" to=".emmc_U1 > .pin44" />
    <trace from=".emmc_U1 > .pin44" to=".emmc_U1 > .pin45" />
    <trace from=".emmc_U1 > .pin45" to=".emmc_U1 > .pin46" />
    <trace from=".emmc_U1 > .pin46" to=".emmc_U1 > .pin47" />
    <trace from=".emmc_U1 > .pin47" to=".emmc_U1 > .pin48" />
    <trace from=".emmc_U1 > .pin48" to=".emmc_U1 > .pin49" />
    <trace from=".emmc_U1 > .pin49" to=".emmc_U1 > .pin50" />
    <trace from=".emmc_U1 > .pin50" to=".emmc_U1 > .pin51" />
    <trace from=".emmc_U1 > .pin51" to=".emmc_U1 > .pin52" />
    <trace from=".emmc_U1 > .pin52" to=".emmc_U1 > .pin53" />
    <trace from=".emmc_U1 > .pin53" to=".emmc_U1 > .pin54" />
    <trace from=".emmc_U1 > .pin54" to=".emmc_U1 > .pin55" />
    <trace from=".emmc_U1 > .pin55" to=".emmc_U1 > .pin56" />
    <trace from=".emmc_U1 > .pin56" to=".emmc_U1 > .pin57" />
    <trace from=".emmc_U1 > .pin57" to=".emmc_U1 > .pin58" />
    <trace from=".emmc_U1 > .pin58" to=".emmc_U1 > .pin59" />
    <trace from=".emmc_U1 > .pin59" to=".emmc_U1 > .pin60" />
    <trace from=".emmc_U1 > .pin60" to=".emmc_U1 > .pin61" />
    <trace from=".emmc_U1 > .pin61" to=".emmc_U1 > .pin62" />
    <trace from=".emmc_U1 > .pin62" to=".emmc_U1 > .pin63" />
    <trace from=".emmc_U1 > .pin63" to=".emmc_U1 > .pin64" />
    <trace from=".emmc_U1 > .pin64" to=".emmc_U1 > .pin65" />
    <trace from=".emmc_U1 > .pin65" to=".emmc_U1 > .pin66" />
    <trace from=".emmc_U1 > .pin66" to=".emmc_U1 > .pin67" />
    <trace from=".emmc_U1 > .pin67" to=".emmc_U1 > .pin68" />
    <trace from=".emmc_U1 > .pin68" to=".emmc_U1 > .pin69" />
    <trace from=".emmc_U1 > .pin69" to=".emmc_U1 > .pin70" />
    <trace from=".emmc_U1 > .pin70" to=".emmc_U1 > .pin71" />
    <trace from=".emmc_U1 > .pin71" to=".emmc_U1 > .pin72" />
    <trace from=".emmc_U1 > .pin72" to=".emmc_U1 > .pin73" />
    <trace from=".emmc_U1 > .pin73" to=".emmc_U1 > .pin74" />
    <trace from=".emmc_U1 > .pin74" to=".emmc_U1 > .pin75" />
    <trace from=".emmc_U1 > .pin75" to=".emmc_U1 > .pin76" />
    <trace from=".emmc_U1 > .pin76" to=".emmc_U1 > .pin77" />
    <trace from=".emmc_U1 > .pin77" to=".emmc_U1 > .pin78" />
    <trace from=".emmc_U1 > .pin78" to=".emmc_U1 > .pin79" />
    <trace from=".emmc_U1 > .pin79" to=".emmc_U1 > .pin80" />
    <trace from=".emmc_U1 > .pin80" to=".emmc_U1 > .pin81" />
    <trace from=".emmc_U1 > .pin81" to=".emmc_U1 > .pin82" />
    <trace from=".emmc_U1 > .pin82" to=".emmc_U1 > .pin83" />
    <trace from=".emmc_U1 > .pin83" to=".emmc_U1 > .pin84" />
    <trace from=".emmc_U1 > .pin84" to=".emmc_U1 > .pin85" />
    <trace from=".emmc_U1 > .pin85" to=".emmc_U1 > .pin86" />
    <trace from=".emmc_U1 > .pin86" to=".emmc_U1 > .pin87" />
    <trace from=".emmc_U1 > .pin87" to=".emmc_U1 > .pin88" />
    <trace from=".emmc_U1 > .pin88" to=".emmc_U1 > .pin89" />
    <trace from=".emmc_U1 > .pin89" to=".emmc_U1 > .pin90" />
    <trace from=".emmc_U1 > .pin90" to=".emmc_U1 > .pin91" />
    <trace from=".emmc_U1 > .pin91" to=".emmc_U1 > .pin92" />
    <trace from=".emmc_U1 > .pin92" to=".emmc_U1 > .pin93" />
    <trace from=".emmc_U1 > .pin93" to=".emmc_U1 > .pin94" />
    <trace from=".emmc_U1 > .pin94" to=".emmc_U1 > .pin95" />
    <trace from=".emmc_U1 > .pin95" to=".emmc_U1 > .pin96" />
    <trace from=".emmc_U1 > .pin96" to=".emmc_U1 > .pin97" />
    <trace from=".emmc_U1 > .pin97" to=".emmc_U1 > .pin98" />
    <trace from=".emmc_U1 > .pin98" to=".emmc_U1 > .pin99" />
    <trace from=".emmc_U1 > .pin99" to=".emmc_U1 > .pin100" />
    <trace from=".emmc_U1 > .pin100" to=".emmc_U1 > .pin101" />
    <trace from=".emmc_U1 > .pin101" to=".emmc_U1 > .pin102" />
    <trace from=".emmc_U1 > .pin102" to=".emmc_U1 > .pin103" />
    <trace from=".emmc_U1 > .pin103" to=".emmc_U1 > .pin104" />
    <trace from=".emmc_U1 > .pin104" to=".emmc_U1 > .pin105" />
    <trace from=".emmc_U1 > .pin105" to=".emmc_U1 > .pin106" />
    <trace from=".emmc_U1 > .pin106" to=".emmc_U1 > .pin107" />
    <trace from=".emmc_U1 > .pin107" to=".emmc_U1 > .pin108" />
    <trace from=".emmc_U1 > .pin108" to=".emmc_U1 > .pin109" />
    <trace from=".emmc_U1 > .pin109" to=".emmc_U1 > .pin110" />
    <trace from=".emmc_U1 > .pin110" to=".emmc_U1 > .pin111" />
    <trace from=".emmc_U1 > .pin111" to=".emmc_U1 > .pin112" />
    <trace from=".emmc_U1 > .pin112" to=".emmc_U1 > .pin113" />
    <trace from=".emmc_U1 > .pin113" to=".emmc_U1 > .pin114" />
    <trace from=".emmc_U1 > .pin114" to=".emmc_U1 > .pin115" />
    <trace from=".emmc_U1 > .pin115" to=".emmc_U1 > .pin116" />
    <trace from=".emmc_U1 > .pin116" to=".emmc_U1 > .pin117" />
    <trace from=".emmc_U1 > .pin117" to=".emmc_U1 > .pin118" />
    <trace from=".emmc_U1 > .pin118" to=".emmc_U1 > .pin119" />
    <trace from=".emmc_U1 > .pin119" to=".emmc_U1 > .pin120" />
    <trace from=".emmc_U1 > .pin120" to=".emmc_U1 > .pin121" />
    <trace from=".emmc_U1 > .pin121" to=".emmc_U1 > .pin122" />
    <trace from=".emmc_U1 > .pin122" to=".emmc_U1 > .pin123" />
    <trace from=".emmc_U1 > .pin123" to=".emmc_U1 > .pin124" />
    <trace from=".emmc_U1 > .pin124" to=".emmc_U1 > .pin125" />
    <trace from=".emmc_U1 > .pin125" to=".emmc_U1 > .pin126" />
    <trace from=".emmc_U1 > .pin126" to=".emmc_U1 > .pin127" />
    <trace from=".emmc_U1 > .pin127" to=".emmc_U1 > .pin128" />
    <trace from=".emmc_U1 > .pin128" to=".emmc_U1 > .pin129" />
    <trace from=".emmc_U1 > .pin129" to=".emmc_U1 > .pin130" />
    <trace from=".emmc_U1 > .pin130" to=".emmc_U1 > .pin131" />
    <trace from=".emmc_U1 > .pin131" to=".emmc_U1 > .pin132" />
    <trace from=".emmc_U1 > .pin132" to=".emmc_U1 > .pin133" />
    <trace from=".emmc_U1 > .pin133" to=".emmc_U1 > .pin134" />
    <trace from=".emmc_U1 > .pin134" to=".emmc_U1 > .pin135" />
    <trace from=".emmc_U1 > .pin135" to=".emmc_U1 > .pin136" />
    <trace from=".emmc_U1 > .pin136" to=".emmc_U1 > .pin137" />
    <trace from=".emmc_U1 > .pin137" to=".emmc_U1 > .pin138" />
    <trace from=".emmc_U1 > .pin138" to=".emmc_U1 > .pin139" />
    <trace from=".emmc_U1 > .pin139" to=".emmc_U1 > .pin140" />
    <trace from=".emmc_U1 > .pin140" to=".emmc_U1 > .pin141" />
    <trace from=".emmc_U1 > .pin141" to=".emmc_U1 > .pin142" />
    <trace from=".emmc_U1 > .pin142" to=".emmc_U1 > .pin143" />
    <trace from=".emmc_U1 > .pin143" to=".emmc_U1 > .pin144" />
    <trace from=".emmc_U1 > .pin144" to=".emmc_U1 > .pin145" />
    <trace from=".emmc_U1 > .pin145" to=".emmc_U1 > .pin146" />
    <trace from=".emmc_U1 > .pin146" to=".emmc_U1 > .pin147" />
    <trace from=".emmc_U1 > .pin147" to=".emmc_U1 > .pin148" />
    <trace from=".emmc_U1 > .pin148" to=".emmc_U1 > .pin149" />
    <trace from=".emmc_U1 > .pin149" to=".emmc_U1 > .pin150" />
    <trace from=".emmc_U1 > .pin150" to=".emmc_U1 > .pin151" />
    <trace from=".emmc_U1 > .pin151" to=".emmc_U1 > .pin152" />
    <trace from=".emmc_U1 > .pin152" to=".emmc_U1 > .pin153" />
    <trace from=".emmc_U1 > .pin153" to=".pmic_U1 > .pin4" />
    <trace from=".pmic_U1 > .pin4" to=".pmic_U1 > .pin5" />
    <trace from=".pmic_U1 > .pin5" to=".pmic_U1 > .pin6" />
    <trace from=".hdmitx_C8 > .pin1" to=".hdmiconn_J1 > .pin12" />
    <trace from=".hdmiconn_J1 > .pin12" to=".hdmiconn_D8 > .pin1" />
    <trace from=".hdmitx_C7 > .pin1" to=".hdmiconn_J1 > .pin10" />
    <trace from=".hdmiconn_J1 > .pin10" to=".hdmiconn_D7 > .pin1" />
    <trace from=".hdmitx_C6 > .pin1" to=".hdmiconn_J1 > .pin9" />
    <trace from=".hdmiconn_J1 > .pin9" to=".hdmiconn_D6 > .pin1" />
    <trace from=".hdmiconn_D6 > .pin1" to=".soc_U1 > .pin92" />
    <trace from=".hdmitx_C5 > .pin1" to=".hdmiconn_J1 > .pin7" />
    <trace from=".hdmiconn_J1 > .pin7" to=".hdmiconn_D5 > .pin1" />
    <trace from=".hdmiconn_D5 > .pin1" to=".soc_U1 > .pin91" />
    <trace from=".hdmitx_C4 > .pin1" to=".hdmiconn_J1 > .pin6" />
    <trace from=".hdmiconn_J1 > .pin6" to=".hdmiconn_D4 > .pin1" />
    <trace from=".hdmitx_C3 > .pin1" to=".hdmiconn_J1 > .pin4" />
    <trace from=".hdmiconn_J1 > .pin4" to=".hdmiconn_D3 > .pin1" />
    <trace from=".hdmitx_C2 > .pin1" to=".hdmiconn_J1 > .pin3" />
    <trace from=".hdmiconn_J1 > .pin3" to=".hdmiconn_D2 > .pin1" />
    <trace from=".hdmitx_C1 > .pin1" to=".hdmiconn_J1 > .pin1" />
    <trace from=".hdmiconn_J1 > .pin1" to=".hdmiconn_D1 > .pin1" />
    <trace from=".hdmitx_C6 > .pin2" to=".hdmitx_D6 > .pin1" />
    <trace from=".hdmitx_D6 > .pin1" to=".hdmitx_J1 > .pin9" />
    <trace from=".hdmitx_C5 > .pin2" to=".hdmitx_D5 > .pin1" />
    <trace from=".hdmitx_D5 > .pin1" to=".hdmitx_J1 > .pin7" />
    <trace from=".hdmitx_C4 > .pin2" to=".hdmitx_D4 > .pin1" />
    <trace from=".hdmitx_D4 > .pin1" to=".hdmitx_J1 > .pin6" />
    <trace from=".hdmitx_C3 > .pin2" to=".hdmitx_D3 > .pin1" />
    <trace from=".hdmitx_D3 > .pin1" to=".hdmitx_J1 > .pin4" />
    <trace from=".hdmitx_C2 > .pin2" to=".hdmitx_D2 > .pin1" />
    <trace from=".hdmitx_D2 > .pin1" to=".hdmitx_J1 > .pin3" />
    <trace from=".hdmitx_C1 > .pin2" to=".hdmitx_D1 > .pin1" />
    <trace from=".hdmitx_D1 > .pin1" to=".hdmitx_J1 > .pin1" />
    <trace from=".hdmitx_C8 > .pin2" to=".hdmitx_D8 > .pin1" />
    <trace from=".hdmitx_D8 > .pin1" to=".hdmitx_J1 > .pin12" />
    <trace from=".hdmitx_C7 > .pin2" to=".hdmitx_D7 > .pin1" />
    <trace from=".hdmitx_D7 > .pin1" to=".hdmitx_J1 > .pin10" />
    <trace from=".pmic_U1 > .pin35" to=".pmic_R1 > .pin2" />
    <trace from=".pmic_R1 > .pin2" to=".hdmitx_D9 > .pin1" />
    <trace from=".hdmitx_D9 > .pin1" to=".hdmitx_J1 > .pin15" />
    <trace from=".hdmitx_J1 > .pin15" to=".codec_U1 > .pin9" />
    <trace from=".codec_U1 > .pin9" to=".codec_R1 > .pin2" />
    <trace from=".codec_R1 > .pin2" to=".eeprom_U1 > .pin6" />
    <trace from=".eeprom_U1 > .pin6" to=".eeprom_R1 > .pin2" />
    <trace from=".eeprom_R1 > .pin2" to=".i2cpull_R1 > .pin2" />
    <trace from=".i2cpull_R1 > .pin2" to=".expansion_J1 > .pin5" />
    <trace from=".expansion_J1 > .pin5" to=".soc_U1 > .pin77" />
    <trace from=".pmic_U1 > .pin36" to=".pmic_R2 > .pin2" />
    <trace from=".pmic_R2 > .pin2" to=".hdmitx_D10 > .pin1" />
    <trace from=".hdmitx_D10 > .pin1" to=".hdmitx_J1 > .pin16" />
    <trace from=".hdmitx_J1 > .pin16" to=".codec_U1 > .pin10" />
    <trace from=".codec_U1 > .pin10" to=".codec_R2 > .pin2" />
    <trace from=".codec_R2 > .pin2" to=".eeprom_U1 > .pin5" />
    <trace from=".eeprom_U1 > .pin5" to=".eeprom_R2 > .pin2" />
    <trace from=".eeprom_R2 > .pin2" to=".i2cpull_R2 > .pin2" />
    <trace from=".i2cpull_R2 > .pin2" to=".expansion_J1 > .pin3" />
    <trace from=".expansion_J1 > .pin3" to=".soc_U1 > .pin78" />
    <trace from=".inprot_U1 > .pin1" to=".inprot_R1 > .pin1" />
    <trace from=".inprot_R1 > .pin1" to=".inprot_C1 > .pin2" />
    <trace from=".jtag_J1 > .pin4" to=".soc_U1 > .pin85" />
    <trace from=".jtag_J1 > .pin8" to=".soc_U1 > .pin87" />
    <trace from=".jtag_J1 > .pin6" to=".soc_U1 > .pin88" />
    <trace from=".jtag_J1 > .pin2" to=".soc_U1 > .pin86" />
    <trace from=".leds_R2 > .pin2" to=".leds_D2 > .pin1" />
    <trace from=".leds_R1 > .pin2" to=".leds_D1 > .pin1" />
    <trace from=".magjack_J1 > .pin9" to=".magjack_R6 > .pin2" />
    <trace from=".magjack_J1 > .pin11" to=".magjack_R1 > .pin1" />
    <trace from=".magjack_J1 > .pin12" to=".magjack_R2 > .pin1" />
    <trace from=".magjack_J1 > .pin13" to=".magjack_R3 > .pin1" />
    <trace from=".magjack_J1 > .pin14" to=".magjack_R4 > .pin1" />
    <trace from=".magjack_R1 > .pin2" to=".magjack_R2 > .pin2" />
    <trace from=".magjack_R2 > .pin2" to=".magjack_R3 > .pin2" />
    <trace from=".magjack_R3 > .pin2" to=".magjack_R4 > .pin2" />
    <trace from=".magjack_R4 > .pin2" to=".magjack_C1 > .pin1" />
    <trace from=".magjack_J1 > .pin7" to=".magjack_R5 > .pin2" />
    <trace from=".usbcpd_J1 > .pin3" to=".usbcpd_R1 > .pin1" />
    <trace from=".usbcpd_R1 > .pin1" to=".usbcpd_U1 > .pin1" />
    <trace from=".usbcpd_U1 > .pin1" to=".usbcpd_U2 > .pin3" />
    <trace from=".usbcpd_J1 > .pin11" to=".usbcpd_R2 > .pin1" />
    <trace from=".usbcpd_R2 > .pin1" to=".usbcpd_U1 > .pin2" />
    <trace from=".usbcpd_U1 > .pin2" to=".usbcpd_U2 > .pin4" />
    <trace from=".pmic_U1 > .pin37" to=".pmic_R3 > .pin2" />
    <trace from=".pmic_U1 > .pin38" to=".pmic_R4 > .pin2" />
    <trace from=".pmic_U1 > .pin13" to=".pmic_U1 > .pin14" />
    <trace from=".pmic_U1 > .pin14" to=".pmic_L4 > .pin1" />
    <trace from=".pmic_U1 > .pin15" to=".pmic_U1 > .pin16" />
    <trace from=".pmic_U1 > .pin16" to=".pmic_L5 > .pin1" />
    <trace from=".pmic_L1 > .pin1" to=".pmic_U1 > .pin7" />
    <trace from=".pmic_U1 > .pin7" to=".pmic_U1 > .pin8" />
    <trace from=".pmic_U1 > .pin11" to=".pmic_U1 > .pin12" />
    <trace from=".pmic_U1 > .pin12" to=".pmic_L3 > .pin1" />
    <trace from=".pmic_U1 > .pin9" to=".pmic_U1 > .pin10" />
    <trace from=".pmic_U1 > .pin10" to=".pmic_L2 > .pin1" />
    <trace from=".pmic_U1 > .pin39" to=".pmic_R5 > .pin1" />
    <trace from=".pmic_R5 > .pin1" to=".reset_U1 > .pin1" />
    <trace from=".reset_U1 > .pin1" to=".reset_R1 > .pin2" />
    <trace from=".reset_R1 > .pin2" to=".reset_SW1 > .pin1" />
    <trace from=".reset_SW1 > .pin1" to=".soc_U1 > .pin82" />
    <trace from=".reset_U1 > .pin5" to=".reset_C1 > .pin1" />
    <trace from=".phy_U1 > .pin11" to=".soc_U1 > .pin67" />
    <trace from=".phy_U1 > .pin12" to=".soc_U1 > .pin68" />
    <trace from=".phy_U1 > .pin13" to=".phy_R3 > .pin1" />
    <trace from=".phy_R3 > .pin1" to=".soc_U1 > .pin73" />
    <trace from=".phy_U1 > .pin14" to=".phy_R4 > .pin1" />
    <trace from=".phy_R4 > .pin1" to=".soc_U1 > .pin74" />
    <trace from=".phy_U1 > .pin15" to=".phy_R5 > .pin1" />
    <trace from=".phy_R5 > .pin1" to=".soc_U1 > .pin75" />
    <trace from=".phy_U1 > .pin16" to=".soc_U1 > .pin76" />
    <trace from=".phy_U1 > .pin5" to=".soc_U1 > .pin65" />
    <trace from=".phy_U1 > .pin6" to=".soc_U1 > .pin66" />
    <trace from=".phy_U1 > .pin7" to=".soc_U1 > .pin69" />
    <trace from=".phy_U1 > .pin8" to=".soc_U1 > .pin70" />
    <trace from=".phy_U1 > .pin9" to=".soc_U1 > .pin71" />
    <trace from=".phy_U1 > .pin10" to=".soc_U1 > .pin72" />
    <trace from=".codec_U1 > .pin5" to=".soc_U1 > .pin94" />
    <trace from=".codec_U1 > .pin6" to=".soc_U1 > .pin95" />
    <trace from=".codec_U1 > .pin4" to=".soc_U1 > .pin93" />
    <trace from=".codec_U1 > .pin8" to=".soc_U1 > .pin97" />
    <trace from=".codec_U1 > .pin7" to=".soc_U1 > .pin96" />
    <trace from=".usdcard_J1 > .pin7" to=".expansion_J1 > .pin35" />
    <trace from=".usdcard_J1 > .pin8" to=".expansion_J1 > .pin36" />
    <trace from=".jtag_J1 > .pin10" to=".reset_U1 > .pin3" />
    <trace from=".reset_U1 > .pin3" to=".soc_U1 > .pin81" />
    <trace from=".pmic_C1 > .pin1" to=".pmic_C2 > .pin1" />
    <trace from=".pmic_C2 > .pin1" to=".inprot_U1 > .pin3" />
    <trace from=".inprot_U1 > .pin3" to=".buck33_U1 > .pin8" />
    <trace from=".buck33_U1 > .pin8" to=".buck33_U1 > .pin11" />
    <trace from=".buck33_U1 > .pin11" to=".buck33_U1 > .pin12" />
    <trace from=".buck33_U1 > .pin12" to=".buck33_U1 > .pin13" />
    <trace from=".buck33_U1 > .pin13" to=".buck33_C1 > .pin1" />
    <trace from=".buck33_C1 > .pin1" to=".buck33_C2 > .pin1" />
    <trace from=".buck33_C2 > .pin1" to=".buck33_C3 > .pin1" />
    <trace from=".buck33_C3 > .pin1" to=".buck33_C4 > .pin1" />
    <trace from=".buck33_C4 > .pin1" to=".buck18_U1 > .pin5" />
    <trace from=".buck18_U1 > .pin5" to=".buck18_U1 > .pin6" />
    <trace from=".buck18_U1 > .pin6" to=".buck18_U1 > .pin7" />
    <trace from=".buck18_U1 > .pin7" to=".buck18_C1 > .pin1" />
    <trace from=".buck18_C1 > .pin1" to=".buck18_C2 > .pin1" />
    <trace from=".buck18_C2 > .pin1" to=".buck18_C3 > .pin1" />
    <trace from=".buck18_C3 > .pin1" to=".bulk_C1 > .pin1" />
    <trace from=".bulk_C1 > .pin1" to=".bulk_C2 > .pin1" />
    <trace from=".bulk_C2 > .pin1" to=".hdmiconn_J1 > .pin18" />
    <trace from=".hdmiconn_J1 > .pin18" to=".usbhost_U1 > .pin4" />
    <trace from=".usbhost_U1 > .pin4" to=".expansion_J1 > .pin2" />
    <trace from=".expansion_J1 > .pin2" to=".expansion_J1 > .pin4" />
    <trace from=".expansion_J1 > .pin4" to=".pmic_U1 > .pin1" />
    <trace from=".pmic_U1 > .pin1" to=".pmic_U1 > .pin2" />
    <trace from=".pmic_U1 > .pin2" to=".pmic_U1 > .pin3" />
    <trace from=".console_U1 > .pin2" to=".expansion_J1 > .pin10" />
    <trace from=".expansion_J1 > .pin10" to=".soc_U1 > .pin80" />
    <trace from=".console_U1 > .pin3" to=".expansion_J1 > .pin8" />
    <trace from=".expansion_J1 > .pin8" to=".soc_U1 > .pin79" />
    <trace from=".usbcpd_J1 > .pin2" to=".usbcpd_J1 > .pin7" />
    <trace from=".usbcpd_J1 > .pin7" to=".usbcpd_J1 > .pin10" />
    <trace from=".usbcpd_J1 > .pin10" to=".usbcpd_J1 > .pin15" />
    <trace from=".usbcpd_J1 > .pin15" to=".usbcpd_U1 > .pin3" />
    <trace from=".usbcpd_U1 > .pin3" to=".usbcpd_D1 > .pin2" />
    <trace from=".usbcpd_D1 > .pin2" to=".inprot_U1 > .pin2" />
    <trace from=".inprot_U1 > .pin2" to=".inprot_C1 > .pin1" />
    <trace from=".usbcpd_J1 > .pin5" to=".usbcpd_J1 > .pin13" />
    <trace from=".usbcpd_J1 > .pin13" to=".usbcpd_U2 > .pin2" />
    <trace from=".usbcpd_U2 > .pin2" to=".usbhost_U2 > .pin3" />
    <trace from=".usbhost_U2 > .pin3" to=".usbhost_U2 > .pin4" />
    <trace from=".usbhost_U2 > .pin4" to=".usbhost_J1 > .pin2" />
    <trace from=".usbhost_J1 > .pin2" to=".soc_U1 > .pin90" />
    <trace from=".usbcpd_J1 > .pin4" to=".usbcpd_J1 > .pin12" />
    <trace from=".usbcpd_J1 > .pin12" to=".usbcpd_U2 > .pin1" />
    <trace from=".usbcpd_U2 > .pin1" to=".usbhost_U2 > .pin1" />
    <trace from=".usbhost_U2 > .pin1" to=".usbhost_U2 > .pin6" />
    <trace from=".usbhost_U2 > .pin6" to=".usbhost_J1 > .pin3" />
    <trace from=".usbhost_J1 > .pin3" to=".soc_U1 > .pin89" />
    <trace from=".usbhost_U1 > .pin1" to=".usbhost_R1 > .pin1" />
    <trace from=".usbhost_U1 > .pin5" to=".usbhost_U2 > .pin5" />
    <trace from=".usbhost_U2 > .pin5" to=".usbhost_J1 > .pin1" />
    <trace from=".soc_U1 > .pin11" to=".pmic_U1 > .pin20" />
    <trace from=".pmic_U1 > .pin20" to=".pmic_U1 > .pin41" />
    <trace from=".pmic_U1 > .pin41" to=".pmic_L4 > .pin2" />
    <trace from=".pmic_L4 > .pin2" to=".pmic_C9 > .pin1" />
    <trace from=".pmic_C9 > .pin1" to=".pmic_C10 > .pin1" />
    <trace from=".pmic_C10 > .pin1" to=".soc_U1 > .pin12" />
    <trace from=".soc_U1 > .pin12" to=".buck18_U1 > .pin13" />
    <trace from=".buck18_U1 > .pin13" to=".buck18_L1 > .pin2" />
    <trace from=".buck18_L1 > .pin2" to=".buck18_C4 > .pin1" />
    <trace from=".buck18_C4 > .pin1" to=".buck18_C5 > .pin1" />
    <trace from=".buck18_C5 > .pin1" to=".buck18_C6 > .pin1" />
    <trace from=".buck18_C6 > .pin1" to=".buck18_R1 > .pin1" />
    <trace from=".buck18_R1 > .pin1" to=".ldo06_U1 > .pin1" />
    <trace from=".ldo06_U1 > .pin1" to=".ldo06_U1 > .pin3" />
    <trace from=".ldo06_U1 > .pin3" to=".ldo06_C1 > .pin1" />
    <trace from=".ldo06_C1 > .pin1" to=".railcaps_C6 > .pin1" />
    <trace from=".railcaps_C6 > .pin1" to=".railcaps_C7 > .pin1" />
    <trace from=".railcaps_C7 > .pin1" to=".railcaps_C8 > .pin1" />
    <trace from=".railcaps_C8 > .pin1" to=".railcaps_C9 > .pin1" />
    <trace from=".railcaps_C9 > .pin1" to=".railcaps_C10 > .pin1" />
    <trace from=".railcaps_C10 > .pin1" to=".phy_U1 > .pin3" />
    <trace from=".phy_U1 > .pin3" to=".phy_R1 > .pin2" />
    <trace from=".phy_R1 > .pin2" to=".phy_R2 > .pin2" />
    <trace from=".phy_R2 > .pin2" to=".phy_R3 > .pin2" />
    <trace from=".phy_R3 > .pin2" to=".socdecoup_C27 > .pin1" />
    <trace from=".socdecoup_C27 > .pin1" to=".socdecoup_C28 > .pin1" />
    <trace from=".socdecoup_C28 > .pin1" to=".socdecoup_C29 > .pin1" />
    <trace from=".socdecoup_C29 > .pin1" to=".socdecoup_C30 > .pin1" />
    <trace from=".socdecoup_C30 > .pin1" to=".socdecoup_C31 > .pin1" />
    <trace from=".socdecoup_C31 > .pin1" to=".socdecoup_C32 > .pin1" />
    <trace from=".socdecoup_C32 > .pin1" to=".socdecoup_C33 > .pin1" />
    <trace from=".socdecoup_C33 > .pin1" to=".socdecoup_C34 > .pin1" />
    <trace from=".socdecoup_C34 > .pin1" to=".emmc_U1 > .pin2" />
    <trace from=".emmc_U1 > .pin2" to=".soc_U1 > .pin10" />
    <trace from=".pmic_U1 > .pin21" to=".pmic_U1 > .pin40" />
    <trace from=".pmic_U1 > .pin40" to=".pmic_L5 > .pin2" />
    <trace from=".pmic_L5 > .pin2" to=".pmic_C11 > .pin1" />
    <trace from=".pmic_C11 > .pin1" to=".pmic_C12 > .pin1" />
    <trace from=".pmic_C12 > .pin1" to=".pmic_R1 > .pin1" />
    <trace from=".pmic_R1 > .pin1" to=".pmic_R2 > .pin1" />
    <trace from=".pmic_R2 > .pin1" to=".pmic_R3 > .pin1" />
    <trace from=".pmic_R3 > .pin1" to=".pmic_R4 > .pin1" />
    <trace from=".pmic_R4 > .pin1" to=".buck33_U1 > .pin10" />
    <trace from=".buck33_U1 > .pin10" to=".soc_U1 > .pin13" />
    <trace from=".soc_U1 > .pin13" to=".buck33_L1 > .pin2" />
    <trace from=".buck33_L1 > .pin2" to=".buck33_C5 > .pin1" />
    <trace from=".buck33_C5 > .pin1" to=".buck33_C6 > .pin1" />
    <trace from=".buck33_C6 > .pin1" to=".buck33_R1 > .pin1" />
    <trace from=".buck33_R1 > .pin1" to=".buck33_C7 > .pin1" />
    <trace from=".buck33_C7 > .pin1" to=".ldortc_U1 > .pin1" />
    <trace from=".ldortc_U1 > .pin1" to=".ldortc_U1 > .pin3" />
    <trace from=".ldortc_U1 > .pin3" to=".ldortc_C1 > .pin1" />
    <trace from=".ldortc_C1 > .pin1" to=".ldoaudio_U1 > .pin3" />
    <trace from=".ldoaudio_U1 > .pin3" to=".ldoaudio_U1 > .pin5" />
    <trace from=".ldoaudio_U1 > .pin5" to=".ldoaudio_C1 > .pin1" />
    <trace from=".ldoaudio_C1 > .pin1" to=".ldohdmi_U1 > .pin1" />
    <trace from=".ldohdmi_U1 > .pin1" to=".ldohdmi_U1 > .pin3" />
    <trace from=".ldohdmi_U1 > .pin3" to=".ldohdmi_C1 > .pin1" />
    <trace from=".ldohdmi_C1 > .pin1" to=".soc_U1 > .pin14" />
    <trace from=".soc_U1 > .pin14" to=".railcaps_C1 > .pin1" />
    <trace from=".railcaps_C1 > .pin1" to=".railcaps_C2 > .pin1" />
    <trace from=".railcaps_C2 > .pin1" to=".railcaps_C3 > .pin1" />
    <trace from=".railcaps_C3 > .pin1" to=".railcaps_C4 > .pin1" />
    <trace from=".railcaps_C4 > .pin1" to=".railcaps_C5 > .pin1" />
    <trace from=".railcaps_C5 > .pin1" to=".phy_U1 > .pin1" />
    <trace from=".phy_U1 > .pin1" to=".phy_U1 > .pin2" />
    <trace from=".phy_U1 > .pin2" to=".magjack_J1 > .pin5" />
    <trace from=".magjack_J1 > .pin5" to=".magjack_J1 > .pin6" />
    <trace from=".magjack_J1 > .pin6" to=".soc_U1 > .pin15" />
    <trace from=".soc_U1 > .pin15" to=".magjack_R5 > .pin1" />
    <trace from=".magjack_R5 > .pin1" to=".magjack_R6 > .pin1" />
    <trace from=".magjack_R6 > .pin1" to=".usdcard_J1 > .pin4" />
    <trace from=".usdcard_J1 > .pin4" to=".console_U1 > .pin4" />
    <trace from=".console_U1 > .pin4" to=".console_U1 > .pin9" />
    <trace from=".console_U1 > .pin9" to=".console_U1 > .pin16" />
    <trace from=".console_U1 > .pin16" to=".jtag_J1 > .pin1" />
    <trace from=".jtag_J1 > .pin1" to=".bootsel_SW1 > .pin3" />
    <trace from=".bootsel_SW1 > .pin3" to=".reset_U1 > .pin4" />
    <trace from=".reset_U1 > .pin4" to=".reset_R1 > .pin1" />
    <trace from=".reset_R1 > .pin1" to=".eeprom_U1 > .pin8" />
    <trace from=".eeprom_U1 > .pin8" to=".eeprom_R1 > .pin1" />
    <trace from=".eeprom_R1 > .pin1" to=".eeprom_R2 > .pin1" />
    <trace from=".eeprom_R2 > .pin1" to=".i2cpull_R1 > .pin1" />
    <trace from=".i2cpull_R1 > .pin1" to=".i2cpull_R2 > .pin1" />
    <trace from=".i2cpull_R2 > .pin1" to=".leds_R1 > .pin1" />
    <trace from=".leds_R1 > .pin1" to=".leds_R2 > .pin1" />
    <trace from=".leds_R2 > .pin1" to=".expansion_J1 > .pin1" />
    <trace from=".expansion_J1 > .pin1" to=".expansion_J1 > .pin17" />
    <trace from=".expansion_J1 > .pin17" to=".socdecoup_C35 > .pin1" />
    <trace from=".socdecoup_C35 > .pin1" to=".socdecoup_C36 > .pin1" />
    <trace from=".socdecoup_C36 > .pin1" to=".socdecoup_C37 > .pin1" />
    <trace from=".socdecoup_C37 > .pin1" to=".socdecoup_C38 > .pin1" />
    <trace from=".socdecoup_C38 > .pin1" to=".socdecoup_C39 > .pin1" />
    <trace from=".socdecoup_C39 > .pin1" to=".socdecoup_C40 > .pin1" />
    <trace from=".socdecoup_C40 > .pin1" to=".emmc_U1 > .pin1" />
    <trace from=".soc_U1 > .pin1" to=".soc_U1 > .pin2" />
    <trace from=".soc_U1 > .pin2" to=".pmic_U1 > .pin17" />
    <trace from=".pmic_U1 > .pin17" to=".pmic_L1 > .pin2" />
    <trace from=".pmic_L1 > .pin2" to=".pmic_C3 > .pin1" />
    <trace from=".pmic_C3 > .pin1" to=".pmic_C4 > .pin1" />
    <trace from=".pmic_C4 > .pin1" to=".soc_U1 > .pin3" />
    <trace from=".soc_U1 > .pin3" to=".socdecoup_C1 > .pin1" />
    <trace from=".socdecoup_C1 > .pin1" to=".socdecoup_C2 > .pin1" />
    <trace from=".socdecoup_C2 > .pin1" to=".socdecoup_C3 > .pin1" />
    <trace from=".socdecoup_C3 > .pin1" to=".socdecoup_C4 > .pin1" />
    <trace from=".socdecoup_C4 > .pin1" to=".socdecoup_C5 > .pin1" />
    <trace from=".socdecoup_C5 > .pin1" to=".socdecoup_C6 > .pin1" />
    <trace from=".socdecoup_C6 > .pin1" to=".socdecoup_C7 > .pin1" />
    <trace from=".socdecoup_C7 > .pin1" to=".socdecoup_C8 > .pin1" />
    <trace from=".ldoaudio_U1 > .pin2" to=".ldoaudio_C2 > .pin1" />
    <trace from=".ldoaudio_C2 > .pin1" to=".codec_U1 > .pin1" />
    <trace from=".codec_U1 > .pin1" to=".codec_U1 > .pin2" />
    <trace from=".codec_U1 > .pin2" to=".codec_U1 > .pin23" />
    <trace from=".codec_U1 > .pin23" to=".codec_R1 > .pin1" />
    <trace from=".codec_R1 > .pin1" to=".codec_R2 > .pin1" />
    <trace from=".codec_R2 > .pin1" to=".codec_R3 > .pin1" />
    <trace from=".codec_R3 > .pin1" to=".codec_C1 > .pin1" />
    <trace from=".codec_C1 > .pin1" to=".codec_C2 > .pin1" />
    <trace from=".codec_C2 > .pin1" to=".codec_C3 > .pin1" />
    <trace from=".ldo06_U1 > .pin5" to=".ldo06_C2 > .pin1" />
    <trace from=".ldo06_C2 > .pin1" to=".ddr_U1 > .pin37" />
    <trace from=".ddr_U1 > .pin37" to=".ddr_U1 > .pin38" />
    <trace from=".ddr_U1 > .pin38" to=".ddr_U1 > .pin39" />
    <trace from=".ddr_U1 > .pin39" to=".ddrterm_R3 > .pin1" />
    <trace from=".ddrterm_R3 > .pin1" to=".ddrdecoup_C4 > .pin1" />
    <trace from=".ddrdecoup_C4 > .pin1" to=".ddrdecoup_C5 > .pin1" />
    <trace from=".ddrdecoup_C5 > .pin1" to=".ddrdecoup_C6 > .pin1" />
    <trace from=".pmic_U1 > .pin19" to=".pmic_L3 > .pin2" />
    <trace from=".pmic_L3 > .pin2" to=".pmic_C7 > .pin1" />
    <trace from=".pmic_C7 > .pin1" to=".pmic_C8 > .pin1" />
    <trace from=".pmic_C8 > .pin1" to=".socdecoup_C17 > .pin1" />
    <trace from=".socdecoup_C17 > .pin1" to=".socdecoup_C18 > .pin1" />
    <trace from=".socdecoup_C18 > .pin1" to=".socdecoup_C19 > .pin1" />
    <trace from=".socdecoup_C19 > .pin1" to=".socdecoup_C20 > .pin1" />
    <trace from=".socdecoup_C20 > .pin1" to=".socdecoup_C21 > .pin1" />
    <trace from=".socdecoup_C21 > .pin1" to=".socdecoup_C22 > .pin1" />
    <trace from=".socdecoup_C22 > .pin1" to=".socdecoup_C23 > .pin1" />
    <trace from=".socdecoup_C23 > .pin1" to=".socdecoup_C24 > .pin1" />
    <trace from=".socdecoup_C24 > .pin1" to=".socdecoup_C25 > .pin1" />
    <trace from=".socdecoup_C25 > .pin1" to=".socdecoup_C26 > .pin1" />
    <trace from=".socdecoup_C26 > .pin1" to=".soc_U1 > .pin7" />
    <trace from=".soc_U1 > .pin7" to=".ddr_U1 > .pin34" />
    <trace from=".ddr_U1 > .pin34" to=".ddr_U1 > .pin35" />
    <trace from=".ddr_U1 > .pin35" to=".ddr_U1 > .pin36" />
    <trace from=".ddr_U1 > .pin36" to=".soc_U1 > .pin8" />
    <trace from=".soc_U1 > .pin8" to=".soc_U1 > .pin9" />
    <trace from=".soc_U1 > .pin9" to=".ddrterm_R1 > .pin1" />
    <trace from=".ddrterm_R1 > .pin1" to=".ddrdecoup_C1 > .pin1" />
    <trace from=".ddrdecoup_C1 > .pin1" to=".ddrdecoup_C2 > .pin1" />
    <trace from=".ddrdecoup_C2 > .pin1" to=".ddrdecoup_C3 > .pin1" />
    <trace from=".ldohdmi_U1 > .pin5" to=".ldohdmi_C2 > .pin1" />
    <trace from=".ldortc_U1 > .pin5" to=".ldortc_C2 > .pin1" />
    <trace from=".pmic_U1 > .pin18" to=".pmic_L2 > .pin2" />
    <trace from=".pmic_L2 > .pin2" to=".pmic_C5 > .pin1" />
    <trace from=".pmic_C5 > .pin1" to=".pmic_C6 > .pin1" />
    <trace from=".pmic_C6 > .pin1" to=".soc_U1 > .pin4" />
    <trace from=".soc_U1 > .pin4" to=".soc_U1 > .pin5" />
    <trace from=".soc_U1 > .pin5" to=".soc_U1 > .pin6" />
    <trace from=".soc_U1 > .pin6" to=".socdecoup_C9 > .pin1" />
    <trace from=".socdecoup_C9 > .pin1" to=".socdecoup_C10 > .pin1" />
    <trace from=".socdecoup_C10 > .pin1" to=".socdecoup_C11 > .pin1" />
    <trace from=".socdecoup_C11 > .pin1" to=".socdecoup_C12 > .pin1" />
    <trace from=".socdecoup_C12 > .pin1" to=".socdecoup_C13 > .pin1" />
    <trace from=".socdecoup_C13 > .pin1" to=".socdecoup_C14 > .pin1" />
    <trace from=".socdecoup_C14 > .pin1" to=".socdecoup_C15 > .pin1" />
    <trace from=".socdecoup_C15 > .pin1" to=".socdecoup_C16 > .pin1" />
    <trace from=".xtal24_Y1 > .pin1" to=".xtal24_C1 > .pin1" />
    <trace from=".xtal24_C1 > .pin1" to=".soc_U1 > .pin98" />
    <trace from=".xtal24_Y1 > .pin2" to=".xtal24_C2 > .pin1" />
    <trace from=".xtal24_C2 > .pin1" to=".soc_U1 > .pin99" />
    <trace from=".rtcxtal_Y1 > .pin1" to=".rtcxtal_C1 > .pin1" />
    <trace from=".rtcxtal_Y1 > .pin2" to=".rtcxtal_C2 > .pin1" />
  </board>
)
