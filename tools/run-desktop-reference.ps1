param(
 [Parameter(Mandatory=$true)][string]$InputFile,
 [Parameter(Mandatory=$true)][string]$OutputFile,
 [string]$DesktopHome=(Join-Path $env:LOCALAPPDATA 'Programs\DWSIM')
)
$ErrorActionPreference='Stop'
if([Environment]::Version.Major -lt 10){throw 'DWSIM 10.2.15 requiere PowerShell sobre .NET 10; probado con PowerShell 7.6.'}
$inputPath=(Resolve-Path -LiteralPath $InputFile).Path
$outputPath=[IO.Path]::GetFullPath($OutputFile)
if(Test-Path -LiteralPath $outputPath){throw 'La referencia ya existe; usar una carpeta de salida nueva para no sobrescribirla.'}
$env:DWSIM_DESKTOP_HOME=(Resolve-Path -LiteralPath $DesktopHome).Path
$version=(Get-Item -LiteralPath (Join-Path $env:DWSIM_DESKTOP_HOME 'DWSIM.UI.Desktop.Avalonia.exe')).VersionInfo.FileVersion
if(!$version.StartsWith('10.2.15')){throw ('La referencia exige DWSIM 10.2.15; se encontró '+$version)}
$code=@'
using System;using System.IO;using System.Linq;using System.Reflection;using System.Runtime.Loader;using System.Collections;
public class DesktopReference {
 public static void Run(string input,string output){
  var install=Environment.GetEnvironmentVariable("DWSIM_DESKTOP_HOME");
  Directory.SetCurrentDirectory(install);
  AssemblyLoadContext.Default.Resolving+=(context,name)=>{var p=Path.Combine(install,name.Name+".dll");return File.Exists(p)?context.LoadFromAssemblyPath(p):null;};
  Environment.SetEnvironmentVariable("PATH",install+";"+Environment.GetEnvironmentVariable("PATH"));
  var asm=AssemblyLoadContext.Default.LoadFromAssemblyPath(Path.Combine(install,"DWSIM.Automation.dll"));
  var type=asm.GetType("DWSIM.Automation.Automation3",true);
  var automation=Activator.CreateInstance(type);
  var fs=type.GetMethods().First(m=>m.Name=="LoadFlowsheet"&&m.GetParameters().Length==1).Invoke(automation,new object[]{input});
  var errors=((IEnumerable)type.GetMethod("CalculateFlowsheet4").Invoke(automation,new[]{fs})).Cast<object>().ToList();
  if(errors.Count>0)throw new Exception(string.Join("; ",errors));
  type.GetMethod("SaveFlowsheet").Invoke(automation,new object[]{fs,output,false});
 }
}
'@
Add-Type -TypeDefinition $code
[DesktopReference]::Run($inputPath,$outputPath)
Write-Output 'Referencia DWSIM de escritorio recalculada.'
